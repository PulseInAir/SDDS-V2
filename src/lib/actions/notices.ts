"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTaxEventSchema, updateTaxEventSchema } from "@/lib/validations/notices";
import {
  deriveTaxEventAttention,
  isResolvedTaxEvent,
  type TaxEventAttentionLevel,
} from "@/lib/utils/notices";

type TaxEventFilters = {
  search?: string;
  clientId?: string;
  assessmentYearId?: string;
  status?: string;
  eventType?: string;
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

type TaxEventRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  case_id: string;
  filing_record_id: string | null;
  assessment_year_id: string;
  event_type: string;
  category: string;
  status: string;
  issue_date: string | null;
  received_date: string | null;
  response_due_date: string | null;
  submission_date: string | null;
  closure_date: string | null;
  reference_number: string | null;
  amount: number | null;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type TaxEventJoinedRow = TaxEventRow & {
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

type RelatedDocumentRow = {
  id: string;
  case_id: string | null;
  filing_record_id: string | null;
  document_type: string;
};

export type TaxEventActionState = {
  error?: string;
  success?: string;
};

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapZodError(error: ZodError) {
  const flattened = error.flatten();
  return flattened.formErrors[0] ?? Object.values(flattened.fieldErrors).flat()[0] ?? "Validation failed.";
}

async function getTaxEventReferenceData(workspaceId: string, clientId?: string) {
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

async function fetchRelatedDocuments(workspaceId: string, events: TaxEventRow[]) {
  const supabase = await createSupabaseServerClient();

  const caseIds = [...new Set(events.map((event) => event.case_id).filter(Boolean))];
  const filingRecordIds = [...new Set(events.map((event) => event.filing_record_id).filter(Boolean))];

  const caseDocumentsPromise =
    caseIds.length > 0
      ? supabase
          .from("documents")
          .select("id, case_id, filing_record_id, document_type")
          .eq("workspace_id", workspaceId)
          .is("archived_at", null)
          .in("case_id", caseIds)
      : Promise.resolve({ data: [], error: null });

  const filingDocumentsPromise =
    filingRecordIds.length > 0
      ? supabase
          .from("documents")
          .select("id, case_id, filing_record_id, document_type")
          .eq("workspace_id", workspaceId)
          .is("archived_at", null)
          .in("filing_record_id", filingRecordIds)
      : Promise.resolve({ data: [], error: null });

  const [{ data: caseDocuments, error: caseDocumentsError }, { data: filingDocuments, error: filingDocumentsError }] =
    await Promise.all([caseDocumentsPromise, filingDocumentsPromise]);

  if (caseDocumentsError) {
    throw new Error(`Failed to fetch case documents: ${caseDocumentsError.message}`);
  }

  if (filingDocumentsError) {
    throw new Error(`Failed to fetch filing documents: ${filingDocumentsError.message}`);
  }

  const uniqueDocuments = new Map<string, RelatedDocumentRow>();

  for (const document of [...(caseDocuments ?? []), ...(filingDocuments ?? [])] as RelatedDocumentRow[]) {
    uniqueDocuments.set(document.id, document);
  }

  return [...uniqueDocuments.values()];
}

function normalizeTaxEvent(event: TaxEventJoinedRow, relatedDocuments: RelatedDocumentRow[]) {
  const caseDocumentCount = relatedDocuments.filter((document) => document.case_id === event.case_id).length;
  const filingDocumentCount = event.filing_record_id
    ? relatedDocuments.filter((document) => document.filing_record_id === event.filing_record_id).length
    : 0;
  const documentTypePreview = [...new Set(
    relatedDocuments
      .filter((document) =>
        document.case_id === event.case_id ||
        (event.filing_record_id ? document.filing_record_id === event.filing_record_id : false),
      )
      .map((document) => document.document_type),
  )].slice(0, 3);

  return {
    ...event,
    clients: normalizeRelation(event.clients),
    assessment_years: normalizeRelation(event.assessment_years),
    filing_cases: normalizeRelation(event.filing_cases),
    filing_records: normalizeRelation(event.filing_records),
    amountValue: Number(event.amount ?? 0),
    isResolved: isResolvedTaxEvent(event.status),
    attentionLevel: deriveTaxEventAttention(event),
    caseDocumentCount,
    filingDocumentCount,
    documentTypePreview,
  };
}

async function fetchTaxEvents(workspaceId: string, filters: TaxEventFilters) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("tax_events")
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
    throw new Error(`Failed to fetch tax events: ${error.message}`);
  }

  const events = (data ?? []) as TaxEventJoinedRow[];
  const relatedDocuments = await fetchRelatedDocuments(workspaceId, events);
  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  return events
    .map((event) => normalizeTaxEvent(event, relatedDocuments))
    .filter((event) => {
      const filingReference = event.filing_records?.acknowledgement_number?.toLowerCase() ?? "";
      const clientName = event.clients?.full_name.toLowerCase() ?? "";
      const pan = event.clients?.pan_uppercase.toLowerCase() ?? "";
      const category = event.category.toLowerCase();
      const eventType = event.event_type.toLowerCase();
      const referenceNumber = event.reference_number?.toLowerCase() ?? "";
      const nextAction = event.next_action?.toLowerCase() ?? "";
      const notes = event.notes?.toLowerCase() ?? "";

      const matchesSearch =
        !searchTerm ||
        clientName.includes(searchTerm) ||
        pan.includes(searchTerm) ||
        category.includes(searchTerm) ||
        eventType.includes(searchTerm) ||
        referenceNumber.includes(searchTerm) ||
        filingReference.includes(searchTerm) ||
        nextAction.includes(searchTerm) ||
        notes.includes(searchTerm);

      const matchesStatus = filters.status ? event.status === filters.status : true;
      const matchesEventType = filters.eventType ? event.event_type === filters.eventType : true;
      const matchesUnresolved = filters.unresolvedOnly ? !event.isResolved : true;
      const matchesAttention = filters.attentionOnly
        ? ["overdue", "due"].includes(event.attentionLevel)
        : true;

      return matchesSearch && matchesStatus && matchesEventType && matchesUnresolved && matchesAttention;
    })
    .sort((left, right) => {
      const order: Record<TaxEventAttentionLevel, number> = {
        overdue: 0,
        due: 1,
        awaiting_closure: 2,
        open: 3,
        resolved: 4,
      };

      const attentionDelta = order[left.attentionLevel] - order[right.attentionLevel];
      if (attentionDelta !== 0) {
        return attentionDelta;
      }

      return `${right.updated_at}`.localeCompare(`${left.updated_at}`);
    });
}

export async function getNoticesModuleData(filters: TaxEventFilters = {}) {
  const session = await getAuthenticatedWorkspaceSession();
  const referenceData = await getTaxEventReferenceData(session.workspace.id, filters.clientId);
  const events = await fetchTaxEvents(session.workspace.id, filters);

  const totalEvents = events.length;
  const pageSize = filters.pageSize ?? 10;
  const requestedPage = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedEvents = events.slice(startIndex, startIndex + pageSize);

  return {
    filters,
    page,
    pageSize,
    totalPages,
    taxEvents: events,
    paginatedTaxEvents: paginatedEvents,
    ...referenceData,
    summary: {
      totalDemandAmount: Number(events.reduce((sum, event) => sum + event.amountValue, 0).toFixed(2)),
      unresolvedCount: events.filter((event) => !event.isResolved).length,
      dueCount: events.filter((event) => event.attentionLevel === "due").length,
      overdueCount: events.filter((event) => event.attentionLevel === "overdue").length,
      awaitingClosureCount: events.filter((event) => event.attentionLevel === "awaiting_closure").length,
      closedCount: events.filter((event) => event.status === "closed").length,
    },
  };
}

export async function getClientNoticesModuleData(clientId: string, filters: Omit<TaxEventFilters, "clientId"> = {}) {
  return getNoticesModuleData({
    ...filters,
    clientId,
  });
}

export async function createTaxEventAction(
  _previousState: TaxEventActionState,
  formData: FormData,
): Promise<TaxEventActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = createTaxEventSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    assessmentYearId: String(formData.get("assessmentYearId") ?? "").trim(),
    filingRecordId: String(formData.get("filingRecordId") ?? "").trim(),
    eventType: String(formData.get("eventType") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    issueDate: String(formData.get("issueDate") ?? "").trim(),
    receivedDate: String(formData.get("receivedDate") ?? "").trim(),
    responseDueDate: String(formData.get("responseDueDate") ?? "").trim(),
    submissionDate: String(formData.get("submissionDate") ?? "").trim(),
    closureDate: String(formData.get("closureDate") ?? "").trim(),
    referenceNumber: String(formData.get("referenceNumber") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { clientId, assessmentYearId, filingRecordId } = parsed.data;

  const { data: filingCase, error: caseError } = await supabase
    .from("filing_cases")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .eq("assessment_year_id", assessmentYearId)
    .is("archived_at", null)
    .maybeSingle();

  if (caseError) {
    return { error: "Failed to resolve the filing case for this notice record." };
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
    event_type: parsed.data.eventType,
    category: parsed.data.category,
    status: parsed.data.status,
    issue_date: parsed.data.issueDate || null,
    received_date: parsed.data.receivedDate || null,
    response_due_date: parsed.data.responseDueDate || null,
    submission_date: parsed.data.submissionDate || null,
    closure_date: parsed.data.closureDate || null,
    reference_number: parsed.data.referenceNumber || null,
    amount: parsed.data.amount ?? null,
    next_action: parsed.data.nextAction || null,
    notes: parsed.data.notes || null,
  };

  const { data: event, error: eventError } = await supabase
    .from("tax_events")
    .insert(insertPayload)
    .select("id")
    .single();

  if (eventError || !event) {
    return { error: `Failed to create the notice record: ${eventError?.message ?? "Unknown error"}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: clientId,
    case_id: filingCase.id,
    entity_type: "tax_event",
    entity_id: event.id,
    action: "tax_event_created",
    message: `${parsed.data.eventType.replaceAll("_", " ")} moved to ${parsed.data.status.replaceAll("_", " ")}.`,
  });

  revalidatePath("/notices");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/notices`);

  return {
    success: "Notice record created.",
  };
}

export async function updateTaxEventAction(
  taxEventId: string,
  _previousState: TaxEventActionState,
  formData: FormData,
): Promise<TaxEventActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = updateTaxEventSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    assessmentYearId: String(formData.get("assessmentYearId") ?? "").trim(),
    filingRecordId: String(formData.get("filingRecordId") ?? "").trim(),
    eventType: String(formData.get("eventType") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    issueDate: String(formData.get("issueDate") ?? "").trim(),
    receivedDate: String(formData.get("receivedDate") ?? "").trim(),
    responseDueDate: String(formData.get("responseDueDate") ?? "").trim(),
    submissionDate: String(formData.get("submissionDate") ?? "").trim(),
    closureDate: String(formData.get("closureDate") ?? "").trim(),
    referenceNumber: String(formData.get("referenceNumber") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    revalidateTarget: String(formData.get("revalidateTarget") ?? "/notices").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { data: currentEvent, error: currentEventError } = await supabase
    .from("tax_events")
    .select("id, client_id, case_id, assessment_year_id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", taxEventId)
    .is("archived_at", null)
    .single();

  if (currentEventError || !currentEvent) {
    return { error: "Notice record not found." };
  }

  if (
    currentEvent.client_id !== parsed.data.clientId ||
    currentEvent.assessment_year_id !== parsed.data.assessmentYearId
  ) {
    return { error: "Notice record context cannot be moved to a different client or assessment year." };
  }

  if (parsed.data.filingRecordId) {
    const { data: filingRecord, error: filingRecordError } = await supabase
      .from("filing_records")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("case_id", currentEvent.case_id)
      .eq("id", parsed.data.filingRecordId)
      .is("archived_at", null)
      .maybeSingle();

    if (filingRecordError || !filingRecord) {
      return { error: "The selected filing record does not belong to this filing case." };
    }
  }

  const { error: updateError } = await supabase
    .from("tax_events")
    .update({
      filing_record_id: parsed.data.filingRecordId || null,
      event_type: parsed.data.eventType,
      category: parsed.data.category,
      status: parsed.data.status,
      issue_date: parsed.data.issueDate || null,
      received_date: parsed.data.receivedDate || null,
      response_due_date: parsed.data.responseDueDate || null,
      submission_date: parsed.data.submissionDate || null,
      closure_date: parsed.data.closureDate || null,
      reference_number: parsed.data.referenceNumber || null,
      amount: parsed.data.amount ?? null,
      next_action: parsed.data.nextAction || null,
      notes: parsed.data.notes || null,
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", taxEventId);

  if (updateError) {
    return { error: `Failed to update the notice record: ${updateError.message}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: currentEvent.client_id,
    case_id: currentEvent.case_id,
    entity_type: "tax_event",
    entity_id: taxEventId,
    action: "tax_event_updated",
    message: `${parsed.data.eventType.replaceAll("_", " ")} moved to ${parsed.data.status.replaceAll("_", " ")}.`,
  });

  revalidatePath("/notices");
  revalidatePath(`/clients/${currentEvent.client_id}`);
  revalidatePath(`/clients/${currentEvent.client_id}/notices`);
  revalidatePath(parsed.data.revalidateTarget);

  return {
    success: "Notice updated.",
  };
}
