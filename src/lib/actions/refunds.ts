"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createRefundSchema, updateRefundSchema } from "@/lib/validations/refunds";
import {
  deriveRefundAttention,
  isResolvedRefund,
  type RefundAttentionLevel,
} from "@/lib/utils/refunds";

type RefundFilters = {
  search?: string;
  clientId?: string;
  assessmentYearId?: string;
  status?: string;
  unresolvedOnly?: boolean;
  attentionOnly?: boolean;
  page?: number;
  pageSize?: number;
};

type ClientOption = {
  id: string;
  full_name: string;
  pan_uppercase: string;
};

type AssessmentYearOption = {
  id: string;
  label: string;
  is_current: boolean | null;
};

type CaseOption = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_status: string;
  next_action: string | null;
};

type FilingRecordOption = {
  id: string;
  case_id: string;
  filing_kind: string;
  filing_date: string | null;
  acknowledgement_number: string | null;
};

type RefundRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  case_id: string;
  filing_record_id: string | null;
  assessment_year_id: string;
  expected_amount: number | null;
  received_amount: number | null;
  status: string;
  expected_date: string | null;
  last_checked_at: string | null;
  received_date: string | null;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type RefundJoinedRow = RefundRow & {
  clients:
    | {
        id: string;
        full_name: string;
        pan_uppercase: string;
      }
    | Array<{
        id: string;
        full_name: string;
        pan_uppercase: string;
      }>
    | null;
  assessment_years:
    | {
        id: string;
        label: string;
        is_current: boolean | null;
      }
    | Array<{
        id: string;
        label: string;
        is_current: boolean | null;
      }>
    | null;
  filing_cases:
    | {
        id: string;
        case_status: string;
        next_action: string | null;
        due_date: string | null;
      }
    | Array<{
        id: string;
        case_status: string;
        next_action: string | null;
        due_date: string | null;
      }>
    | null;
  filing_records:
    | {
        id: string;
        filing_kind: string;
        filing_date: string | null;
        acknowledgement_number: string | null;
        processing_status: string | null;
        verification_status: string | null;
      }
    | Array<{
        id: string;
        filing_kind: string;
        filing_date: string | null;
        acknowledgement_number: string | null;
        processing_status: string | null;
        verification_status: string | null;
      }>
    | null;
};

export type RefundActionState = {
  error?: string;
  success?: string;
};

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeRefund(refund: RefundJoinedRow) {
  const expectedAmount = Number(refund.expected_amount ?? 0);
  const receivedAmount = Number(refund.received_amount ?? 0);
  const pendingAmount = Math.max(0, Number((expectedAmount - receivedAmount).toFixed(2)));
  const attentionLevel = deriveRefundAttention(refund);

  return {
    ...refund,
    clients: normalizeRelation(refund.clients),
    assessment_years: normalizeRelation(refund.assessment_years),
    filing_cases: normalizeRelation(refund.filing_cases),
    filing_records: normalizeRelation(refund.filing_records),
    expectedAmount,
    receivedAmount,
    pendingAmount,
    isResolved: isResolvedRefund(refund.status),
    attentionLevel,
  };
}

function mapZodError(error: ZodError) {
  const flattened = error.flatten();
  return flattened.formErrors[0] ?? Object.values(flattened.fieldErrors).flat()[0] ?? "Validation failed.";
}

function normalizeLastCheckedAt(value: string | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

async function getRefundReferenceData(workspaceId: string, clientId?: string) {
  const supabase = await createSupabaseServerClient();

  const clientsQuery = supabase
    .from("clients")
    .select("id, full_name, pan_uppercase")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("full_name", { ascending: true });

  if (clientId) {
    clientsQuery.eq("id", clientId);
  }

  const [{ data: clients, error: clientsError }, { data: assessmentYears, error: yearsError }, { data: cases, error: casesError }, { data: filingRecords, error: filingRecordsError }] = await Promise.all([
    clientsQuery,
    supabase
      .from("assessment_years")
      .select("id, label, is_current")
      .eq("workspace_id", workspaceId)
      .order("start_date", { ascending: false }),
    supabase
      .from("filing_cases")
      .select("id, client_id, assessment_year_id, case_status, next_action")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("filing_records")
      .select("id, case_id, filing_kind, filing_date, acknowledgement_number")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("filing_date", { ascending: false }),
  ]);

  if (clientsError) {
    throw new Error(`Failed to fetch clients: ${clientsError.message}`);
  }

  if (yearsError) {
    throw new Error(`Failed to fetch assessment years: ${yearsError.message}`);
  }

  if (casesError) {
    throw new Error(`Failed to fetch filing cases: ${casesError.message}`);
  }

  if (filingRecordsError) {
    throw new Error(`Failed to fetch filing records: ${filingRecordsError.message}`);
  }

  const scopedClients = (clients ?? []) as ClientOption[];
  const scopedCases = ((cases ?? []) as CaseOption[]).filter((filingCase) =>
    clientId ? filingCase.client_id === clientId : true,
  );
  const caseIds = new Set(scopedCases.map((filingCase) => filingCase.id));
  const scopedFilingRecords = ((filingRecords ?? []) as FilingRecordOption[]).filter((filingRecord) =>
    caseIds.has(filingRecord.case_id),
  );

  return {
    clients: scopedClients,
    assessmentYears: (assessmentYears ?? []) as AssessmentYearOption[],
    caseOptions: scopedCases,
    filingRecordOptions: scopedFilingRecords,
  };
}

async function fetchRefunds(workspaceId: string, filters: RefundFilters) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("refunds")
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase),
      assessment_years!inner (id, label, is_current),
      filing_cases!inner (id, case_status, next_action, due_date),
      filing_records (id, filing_kind, filing_date, acknowledgement_number, processing_status, verification_status)
    `)
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.assessmentYearId) {
    query = query.eq("assessment_year_id", filters.assessmentYearId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch refunds: ${error.message}`);
  }

  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  return ((data ?? []) as RefundJoinedRow[])
    .map(normalizeRefund)
    .filter((refund) => {
      const filingReference = refund.filing_records?.acknowledgement_number?.toLowerCase() ?? "";
      const filingKind = refund.filing_records?.filing_kind?.toLowerCase() ?? "";
      const notes = refund.notes?.toLowerCase() ?? "";
      const nextAction = refund.next_action?.toLowerCase() ?? "";
      const clientName = refund.clients?.full_name.toLowerCase() ?? "";
      const pan = refund.clients?.pan_uppercase.toLowerCase() ?? "";

      const matchesSearch =
        !searchTerm ||
        clientName.includes(searchTerm) ||
        pan.includes(searchTerm) ||
        filingReference.includes(searchTerm) ||
        filingKind.includes(searchTerm) ||
        notes.includes(searchTerm) ||
        nextAction.includes(searchTerm);

      const matchesStatus = filters.status ? refund.status === filters.status : true;
      const matchesUnresolved = filters.unresolvedOnly ? !refund.isResolved : true;
      const matchesAttention = filters.attentionOnly
        ? ["overdue", "due", "follow_up"].includes(refund.attentionLevel)
        : true;

      return matchesSearch && matchesStatus && matchesUnresolved && matchesAttention;
    })
    .sort((left, right) => {
      const order: Record<RefundAttentionLevel, number> = {
        overdue: 0,
        due: 1,
        follow_up: 2,
        unresolved: 3,
        resolved: 4,
      };

      const attentionDelta = order[left.attentionLevel] - order[right.attentionLevel];
      if (attentionDelta !== 0) {
        return attentionDelta;
      }

      return `${right.updated_at}`.localeCompare(`${left.updated_at}`);
    });
}

export async function getRefundsModuleData(filters: RefundFilters = {}) {
  const session = await getAuthenticatedWorkspaceSession();
  const referenceData = await getRefundReferenceData(session.workspace.id, filters.clientId);
  const refunds = await fetchRefunds(session.workspace.id, filters);

  const totalRefunds = refunds.length;
  const pageSize = filters.pageSize ?? 10;
  const requestedPage = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalRefunds / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedRefunds = refunds.slice(startIndex, startIndex + pageSize);

  return {
    filters,
    page,
    pageSize,
    totalPages,
    refunds,
    paginatedRefunds,
    ...referenceData,
    summary: {
      expectedAmount: Number(refunds.reduce((sum, refund) => sum + refund.expectedAmount, 0).toFixed(2)),
      receivedAmount: Number(refunds.reduce((sum, refund) => sum + refund.receivedAmount, 0).toFixed(2)),
      pendingAmount: Number(refunds.reduce((sum, refund) => sum + refund.pendingAmount, 0).toFixed(2)),
      unresolvedCount: refunds.filter((refund) => !refund.isResolved).length,
      dueCount: refunds.filter((refund) => refund.attentionLevel === "due").length,
      overdueCount: refunds.filter((refund) => refund.attentionLevel === "overdue").length,
      followUpCount: refunds.filter((refund) => refund.status === "follow_up_required").length,
    },
  };
}

export async function getClientRefundsModuleData(clientId: string, filters: Omit<RefundFilters, "clientId"> = {}) {
  return getRefundsModuleData({
    ...filters,
    clientId,
  });
}

export async function createRefundAction(
  _previousState: RefundActionState,
  formData: FormData,
): Promise<RefundActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = createRefundSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    assessmentYearId: String(formData.get("assessmentYearId") ?? "").trim(),
    filingRecordId: String(formData.get("filingRecordId") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    expectedAmount: String(formData.get("expectedAmount") ?? "").trim(),
    expectedDate: String(formData.get("expectedDate") ?? "").trim(),
    receivedAmount: String(formData.get("receivedAmount") ?? "").trim(),
    receivedDate: String(formData.get("receivedDate") ?? "").trim(),
    lastCheckedAt: String(formData.get("lastCheckedAt") ?? "").trim(),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { clientId, assessmentYearId, filingRecordId, status } = parsed.data;

  const { data: filingCase, error: caseError } = await supabase
    .from("filing_cases")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .eq("assessment_year_id", assessmentYearId)
    .is("archived_at", null)
    .maybeSingle();

  if (caseError) {
    return { error: "Failed to resolve the filing case for this refund record." };
  }

  if (!filingCase) {
    return { error: "Create the filing case first for this client and assessment year." };
  }

  if (filingRecordId) {
    const { data: filingRecord, error: filingRecordError } = await supabase
      .from("filing_records")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("case_id", filingCase.id)
      .eq("id", filingRecordId)
      .is("archived_at", null)
      .maybeSingle();

    if (filingRecordError || !filingRecord) {
      return { error: "The selected filing record does not belong to this filing case." };
    }
  }

  const insertPayload = {
    workspace_id: session.workspace.id,
    client_id: clientId,
    case_id: filingCase.id,
    assessment_year_id: assessmentYearId,
    filing_record_id: filingRecordId || null,
    status,
    expected_amount: parsed.data.expectedAmount ?? null,
    expected_date: parsed.data.expectedDate || null,
    received_amount: parsed.data.receivedAmount ?? null,
    received_date: parsed.data.receivedDate || null,
    last_checked_at: normalizeLastCheckedAt(parsed.data.lastCheckedAt),
    next_action: parsed.data.nextAction || null,
    notes: parsed.data.notes || null,
  };

  const { data: refund, error: refundError } = await supabase
    .from("refunds")
    .insert(insertPayload)
    .select("id")
    .single();

  if (refundError || !refund) {
    return { error: `Failed to create the refund record: ${refundError?.message ?? "Unknown error"}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: clientId,
    case_id: filingCase.id,
    entity_type: "refund",
    entity_id: refund.id,
    action: "refund_created",
    message: `Refund record moved to ${status.replaceAll("_", " ")}.`,
  });

  revalidatePath("/refunds");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/refunds`);

  return {
    success: "Refund record created.",
  };
}

export async function updateRefundAction(
  refundId: string,
  _previousState: RefundActionState,
  formData: FormData,
): Promise<RefundActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = updateRefundSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    assessmentYearId: String(formData.get("assessmentYearId") ?? "").trim(),
    filingRecordId: String(formData.get("filingRecordId") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    expectedAmount: String(formData.get("expectedAmount") ?? "").trim(),
    expectedDate: String(formData.get("expectedDate") ?? "").trim(),
    receivedAmount: String(formData.get("receivedAmount") ?? "").trim(),
    receivedDate: String(formData.get("receivedDate") ?? "").trim(),
    lastCheckedAt: String(formData.get("lastCheckedAt") ?? "").trim(),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    revalidateTarget: String(formData.get("revalidateTarget") ?? "/refunds").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { data: currentRefund, error: currentRefundError } = await supabase
    .from("refunds")
    .select("id, client_id, case_id, assessment_year_id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", refundId)
    .is("archived_at", null)
    .single();

  if (currentRefundError || !currentRefund) {
    return { error: "Refund record not found." };
  }

  if (
    currentRefund.client_id !== parsed.data.clientId ||
    currentRefund.assessment_year_id !== parsed.data.assessmentYearId
  ) {
    return { error: "Refund record context cannot be moved to a different client or assessment year." };
  }

  if (parsed.data.filingRecordId) {
    const { data: filingRecord, error: filingRecordError } = await supabase
      .from("filing_records")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("case_id", currentRefund.case_id)
      .eq("id", parsed.data.filingRecordId)
      .is("archived_at", null)
      .maybeSingle();

    if (filingRecordError || !filingRecord) {
      return { error: "The selected filing record does not belong to this filing case." };
    }
  }

  const { error: updateError } = await supabase
    .from("refunds")
    .update({
      filing_record_id: parsed.data.filingRecordId || null,
      status: parsed.data.status,
      expected_amount: parsed.data.expectedAmount ?? null,
      expected_date: parsed.data.expectedDate || null,
      received_amount: parsed.data.receivedAmount ?? null,
      received_date: parsed.data.receivedDate || null,
      last_checked_at: normalizeLastCheckedAt(parsed.data.lastCheckedAt),
      next_action: parsed.data.nextAction || null,
      notes: parsed.data.notes || null,
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", refundId);

  if (updateError) {
    return { error: `Failed to update the refund record: ${updateError.message}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: currentRefund.client_id,
    case_id: currentRefund.case_id,
    entity_type: "refund",
    entity_id: refundId,
    action: "refund_updated",
    message: `Refund record moved to ${parsed.data.status.replaceAll("_", " ")}.`,
  });

  revalidatePath("/refunds");
  revalidatePath(`/clients/${currentRefund.client_id}`);
  revalidatePath(`/clients/${currentRefund.client_id}/refunds`);
  revalidatePath(parsed.data.revalidateTarget);

  return {
    success: "Refund updated.",
  };
}
