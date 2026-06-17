"use server";

import { createHash, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentChecklistStatus, DocumentRecord } from "@/types/documents";
import {
  DOCUMENT_CHECKLIST_STATUSES,
  DOCUMENT_EXCEPTION_STATUSES,
  buildDocumentStoragePath,
  formatDocumentChecklistStatus,
  generateSafeFilename,
  groupDocumentVersions,
} from "@/lib/utils/documents";

type DocumentFilters = {
  search?: string;
  clientId?: string;
  assessmentYearId?: string;
  checklistStatus?: string;
  type?: string;
  page?: number;
  pageSize?: number;
};

export type DocumentActionState = {
  error?: string;
  success?: string;
};

type PendingCaseWithoutDocuments = {
  id: string;
  next_action: string | null;
  due_date: string | null;
  clients: {
    id: string;
    full_name: string;
    pan_uppercase: string;
  } | null;
  assessment_years: {
    id: string;
    label: string;
  } | null;
};

type PendingCaseQueryRow = {
  id: string;
  next_action: string | null;
  due_date: string | null;
  clients: PendingCaseWithoutDocuments["clients"] | PendingCaseWithoutDocuments["clients"][];
  assessment_years:
    | PendingCaseWithoutDocuments["assessment_years"]
    | PendingCaseWithoutDocuments["assessment_years"][];
};

async function getWorkspaceReferenceData(workspaceId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: clients, error: clientsError }, { data: assessmentYears, error: yearsError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, pan_uppercase")
        .eq("workspace_id", workspaceId)
        .is("archived_at", null)
        .order("full_name", { ascending: true }),
      supabase
        .from("assessment_years")
        .select("id, label, is_current")
        .eq("workspace_id", workspaceId)
        .order("start_date", { ascending: false }),
    ]);

  if (clientsError) {
    throw new Error(`Failed to fetch clients: ${clientsError.message}`);
  }

  if (yearsError) {
    throw new Error(`Failed to fetch assessment years: ${yearsError.message}`);
  }

  return {
    clients: clients ?? [],
    assessmentYears: assessmentYears ?? [],
  };
}

async function fetchScopedDocuments(workspaceId: string, filters: Omit<DocumentFilters, "checklistStatus" | "page" | "pageSize">) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("documents")
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase),
      assessment_years (id, label),
      filing_cases (id, case_status, next_action, due_date),
      filing_records (id, filing_kind, verification_status, processing_status, acknowledgement_number)
    `)
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("uploaded_at", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.assessmentYearId) {
    query = query.eq("assessment_year_id", filters.assessmentYearId);
  }

  if (filters.type) {
    query = query.ilike("document_type", `%${filters.type}%`);
  }

  if (filters.search) {
    const searchUpper = filters.search.toUpperCase();
    query = query.or(
      `full_name.ilike.%${filters.search}%,pan_uppercase.ilike.%${searchUpper}%`,
      { foreignTable: "clients" }
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data ?? []) as DocumentRecord[];
}

async function fetchPendingCasesWithoutDocuments(
  workspaceId: string,
  filters: Omit<DocumentFilters, "checklistStatus" | "page" | "pageSize">,
  caseIdsWithDocuments: Set<string>
) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("filing_cases")
    .select(`
      id,
      next_action,
      due_date,
      clients!inner (id, full_name, pan_uppercase),
      assessment_years!inner (id, label)
    `)
    .eq("workspace_id", workspaceId)
    .eq("case_status", "Documents Pending")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.assessmentYearId) {
    query = query.eq("assessment_year_id", filters.assessmentYearId);
  }

  if (filters.search) {
    const searchUpper = filters.search.toUpperCase();
    query = query.or(
      `full_name.ilike.%${filters.search}%,pan_uppercase.ilike.%${searchUpper}%`,
      { foreignTable: "clients" }
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch document-pending cases: ${error.message}`);
  }

  return ((data ?? []) as unknown as PendingCaseQueryRow[])
    .map((filingCase) => ({
      id: filingCase.id,
      next_action: filingCase.next_action,
      due_date: filingCase.due_date,
      clients: Array.isArray(filingCase.clients) ? (filingCase.clients[0] ?? null) : filingCase.clients,
      assessment_years: Array.isArray(filingCase.assessment_years)
        ? (filingCase.assessment_years[0] ?? null)
        : filingCase.assessment_years,
    }))
    .filter((filingCase) => !caseIdsWithDocuments.has(filingCase.id));
}

export async function getDocumentsModuleData(filters: DocumentFilters = {}) {
  const session = await getAuthenticatedWorkspaceSession();
  const { clients, assessmentYears } = await getWorkspaceReferenceData(session.workspace.id);
  const scopedDocuments = await fetchScopedDocuments(session.workspace.id, filters);
  const chains = groupDocumentVersions(scopedDocuments);
  const visibleChains = filters.checklistStatus
    ? chains.filter((chain) => chain.latest.checklist_status === filters.checklistStatus)
    : chains;

  const caseIdsWithDocuments = new Set(
    chains.map((chain) => chain.latest.case_id).filter((caseId): caseId is string => Boolean(caseId))
  );
  const pendingCasesWithoutDocuments = await fetchPendingCasesWithoutDocuments(
    session.workspace.id,
    filters,
    caseIdsWithDocuments
  );

  const totalChains = visibleChains.length;
  const pageSize = filters.pageSize ?? 12;
  const requestedPage = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalChains / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedChains = visibleChains.slice(startIndex, startIndex + pageSize);

  const exceptionChains = chains.filter((chain) =>
    DOCUMENT_EXCEPTION_STATUSES.has(chain.latest.checklist_status)
  );

  return {
    filters,
    page,
    pageSize,
    totalPages,
    clients,
    assessmentYears,
    chains,
    visibleChains,
    paginatedChains,
    pendingCasesWithoutDocuments,
    summary: {
      totalTrackedDocuments: chains.length,
      exceptionCount: exceptionChains.length + pendingCasesWithoutDocuments.length,
      verifiedCount: chains.filter((chain) => chain.latest.checklist_status === "verified").length,
      receivedCount: chains.filter((chain) => chain.latest.checklist_status === "received").length,
      versionedCount: chains.filter((chain) => chain.versions.length > 1).length,
    },
  };
}

export async function getClientDocumentsModuleData(clientId: string, filters: Omit<DocumentFilters, "clientId" | "search"> = {}) {
  return getDocumentsModuleData({
    ...filters,
    clientId,
  });
}

export async function uploadDocumentAction(
  _previousState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const clientId = String(formData.get("clientId") ?? "").trim();
  const assessmentYearId = String(formData.get("assessmentYearId") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "").trim();
  const checklistStatus = String(formData.get("checklistStatus") ?? "received").trim();
  const replacesDocumentId = String(formData.get("replacesDocumentId") ?? "").trim();
  const revalidateTarget = String(formData.get("revalidateTarget") ?? "/documents").trim();
  const file = formData.get("file");

  if (!clientId || !documentType) {
    return { error: "Client and document type are required." };
  }

  if (!DOCUMENT_CHECKLIST_STATUSES.includes(checklistStatus as DocumentChecklistStatus)) {
    return { error: "Choose a valid checklist status." };
  }

  if (!(file instanceof File) || file.size <= 0) {
    return { error: "Choose a document file to upload." };
  }

  if (!file.type.trim()) {
    return { error: "The selected file is missing a MIME type." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", clientId)
    .is("archived_at", null)
    .single();

  if (clientError || !client) {
    return { error: "Client not found in the active workspace." };
  }

  let caseId: string | undefined;
  if (assessmentYearId) {
    const { data: filingCase } = await supabase
      .from("filing_cases")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("client_id", clientId)
      .eq("assessment_year_id", assessmentYearId)
      .is("archived_at", null)
      .maybeSingle();

    caseId = filingCase?.id;
  }

  let version = 1;
  if (replacesDocumentId) {
    const { data: previousDocument, error: previousDocumentError } = await supabase
      .from("documents")
      .select("id, version")
      .eq("workspace_id", session.workspace.id)
      .eq("client_id", clientId)
      .eq("id", replacesDocumentId)
      .is("archived_at", null)
      .single();

    if (previousDocumentError || !previousDocument) {
      return { error: "The selected replacement target could not be found." };
    }

    version = previousDocument.version + 1;
  }

  const documentId = randomUUID();
  const safeFilename = generateSafeFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
  const storagePath = buildDocumentStoragePath(session.workspace.id, clientId, documentId, safeFilename);

  const { error: uploadError } = await supabase.storage
    .from("sdds-documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Failed to upload document: ${uploadError.message}` };
  }

  const insertPayload = {
    id: documentId,
    workspace_id: session.workspace.id,
    client_id: clientId,
    case_id: caseId,
    assessment_year_id: assessmentYearId || null,
    document_type: documentType,
    checklist_status: checklistStatus,
    storage_bucket: "sdds-documents",
    storage_path: storagePath,
    original_filename: file.name,
    safe_filename: safeFilename,
    mime_type: file.type,
    size_bytes: file.size,
    checksum_sha256: checksumSha256,
    version,
    replaces_document_id: replacesDocumentId || null,
    uploaded_by: session.user.id,
  };

  const { error: insertError } = await supabase.from("documents").insert(insertPayload);

  if (insertError) {
    return { error: `Failed to record document metadata: ${insertError.message}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: clientId,
    case_id: caseId ?? null,
    entity_type: "document",
    entity_id: documentId,
    action: replacesDocumentId ? "document_replaced" : "document_uploaded",
    message: replacesDocumentId
      ? `Document "${file.name}" was uploaded as version ${version}.`
      : `Document "${file.name}" was uploaded.`,
    metadata: replacesDocumentId ? { previous_document_id: replacesDocumentId } : null,
  });

  revalidatePath("/documents");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/documents`);
  revalidatePath(revalidateTarget);

  return {
    success: replacesDocumentId
      ? `Uploaded replacement version ${version} for ${documentType}.`
      : `Uploaded ${documentType}.`,
  };
}

export async function updateDocumentChecklistStatus(
  documentId: string,
  formData: FormData
): Promise<void> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const checklistStatus = String(formData.get("checklistStatus") ?? "").trim();
  const revalidateTarget = String(formData.get("revalidateTarget") ?? "/documents").trim();

  if (!DOCUMENT_CHECKLIST_STATUSES.includes(checklistStatus as DocumentChecklistStatus)) {
    throw new Error("Choose a valid checklist status.");
  }

  const verifiedAt = checklistStatus === "verified" ? new Date().toISOString() : null;
  const verifiedBy = checklistStatus === "verified" ? session.user.id : null;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .update({
      checklist_status: checklistStatus,
      verified_at: verifiedAt,
      verified_by: verifiedBy,
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", documentId)
    .select("id, client_id, document_type")
    .single();

  if (documentError || !document) {
    throw new Error("Failed to update checklist status.");
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: document.client_id,
    entity_type: "document",
    entity_id: documentId,
    action: "document_status_updated",
    message: `${document.document_type} moved to ${formatDocumentChecklistStatus(checklistStatus)}.`,
  });

  revalidatePath("/documents");
  revalidatePath(`/clients/${document.client_id}`);
  revalidatePath(`/clients/${document.client_id}/documents`);
  revalidatePath(revalidateTarget);
}

export async function getSignedDownloadUrl(documentId: string) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path, original_filename")
    .eq("workspace_id", session.workspace.id)
    .eq("id", documentId)
    .is("archived_at", null)
    .single();

  if (fetchError || !document) {
    throw new Error("Failed to fetch document metadata or document not found.");
  }

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("sdds-documents")
    .createSignedUrl(document.storage_path, 60, {
      download: document.original_filename,
    });

  if (urlError || !signedUrlData) {
    throw new Error(`Failed to generate signed download URL: ${urlError?.message}`);
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    entity_type: "document",
    entity_id: documentId,
    action: "document_downloaded",
    message: `Document "${document.original_filename}" was downloaded.`,
  });

  return signedUrlData.signedUrl;
}
