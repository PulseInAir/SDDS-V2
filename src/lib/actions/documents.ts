"use server";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildDocumentStoragePath } from "@/lib/utils/documents";
import type { DocumentUploadPayload, DocumentReplacementPayload } from "@/types/documents";

export async function recordDocumentMetadata(payload: DocumentUploadPayload) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const storagePath = buildDocumentStoragePath(
    session.workspace.id,
    payload.clientId,
    payload.id,
    payload.safeFilename
  );

  const { error } = await supabase.from("documents").insert({
    id: payload.id,
    workspace_id: session.workspace.id,
    client_id: payload.clientId,
    case_id: payload.caseId,
    filing_record_id: payload.filingRecordId,
    assessment_year_id: payload.assessmentYearId,
    document_type: payload.documentType,
    checklist_status: payload.checklistStatus ?? "received",
    storage_bucket: "sdds-documents",
    storage_path: storagePath,
    original_filename: payload.originalFilename,
    safe_filename: payload.safeFilename,
    mime_type: payload.mimeType,
    size_bytes: payload.sizeBytes,
    checksum_sha256: payload.checksumSha256,
    version: 1,
    uploaded_by: session.user.id,
  });

  if (error) {
    throw new Error("Failed to record document metadata: " + error.message);
  }

  // Log to activity_events
  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: payload.clientId,
    case_id: payload.caseId,
    entity_type: "document",
    entity_id: payload.id,
    action: "document_uploaded",
    message: `Document "${payload.originalFilename}" was uploaded.`,
  });

  return { success: true, id: payload.id };
}

export async function recordDocumentReplacement(payload: DocumentReplacementPayload) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const storagePath = buildDocumentStoragePath(
    session.workspace.id,
    payload.clientId,
    payload.id,
    payload.safeFilename
  );

  // Get previous version to increment
  const { data: previousDoc, error: fetchError } = await supabase
    .from("documents")
    .select("version")
    .eq("workspace_id", session.workspace.id)
    .eq("id", payload.replacesDocumentId)
    .single();

  if (fetchError || !previousDoc) {
    throw new Error("Failed to fetch previous document version.");
  }

  const { error } = await supabase.from("documents").insert({
    id: payload.id,
    workspace_id: session.workspace.id,
    client_id: payload.clientId,
    case_id: payload.caseId,
    filing_record_id: payload.filingRecordId,
    assessment_year_id: payload.assessmentYearId,
    document_type: payload.documentType,
    checklist_status: payload.checklistStatus ?? "received",
    storage_bucket: "sdds-documents",
    storage_path: storagePath,
    original_filename: payload.originalFilename,
    safe_filename: payload.safeFilename,
    mime_type: payload.mimeType,
    size_bytes: payload.sizeBytes,
    checksum_sha256: payload.checksumSha256,
    version: previousDoc.version + 1,
    replaces_document_id: payload.replacesDocumentId,
    uploaded_by: session.user.id,
  });

  if (error) {
    throw new Error("Failed to record document replacement metadata: " + error.message);
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: payload.clientId,
    case_id: payload.caseId,
    entity_type: "document",
    entity_id: payload.id,
    action: "document_replaced",
    message: `Document "${payload.originalFilename}" was uploaded as a new version.`,
    metadata: { previous_document_id: payload.replacesDocumentId },
  });

  return { success: true, id: payload.id };
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

  const { data: signedUrlData, error: urlError } = await supabase
    .storage
    .from("sdds-documents")
    .createSignedUrl(document.storage_path, 60, {
      download: document.original_filename,
    });

  if (urlError || !signedUrlData) {
    throw new Error("Failed to generate signed download URL: " + urlError?.message);
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
