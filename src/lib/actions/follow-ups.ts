"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordCommunicationSchema, updateFollowUpSchema } from "@/lib/validations/follow-ups";
import {
  deriveFollowUpAttention,
  formatCommunicationChannel,
  formatCommunicationDirection,
  formatFollowUpStatus,
  type FollowUpAttentionLevel,
} from "@/lib/utils/follow-ups";

type FollowUpFilters = {
  search?: string;
  clientId?: string;
  assessmentYearId?: string;
  status?: string;
  attentionOnly?: boolean;
  page?: number;
  pageSize?: number;
};

type ClientOption = {
  id: string;
  full_name: string;
  pan_uppercase: string;
  mobile: string | null;
  follow_up_excluded: boolean;
  exclusion_reason: string | null;
};

type AssessmentYearOption = {
  id: string;
  label: string;
  start_date: string;
  is_current: boolean | null;
};

type CaseOption = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_status: string;
  next_action: string | null;
};

type FollowUpRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  case_id: string | null;
  assessment_year_id: string | null;
  follow_up_type: string;
  status: string;
  due_date: string;
  completed_at: string | null;
  excluded_at: string | null;
  exclusion_reason: string | null;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type FollowUpJoinedRow = FollowUpRow & {
  clients:
    | ClientOption
    | ClientOption[]
    | null;
  assessment_years:
    | {
        id: string;
        label: string;
        start_date: string;
        is_current: boolean | null;
      }
    | Array<{
        id: string;
        label: string;
        start_date: string;
        is_current: boolean | null;
      }>
    | null;
  filing_cases:
    | {
        id: string;
        case_status: string;
        next_action: string | null;
      }
    | Array<{
        id: string;
        case_status: string;
        next_action: string | null;
      }>
    | null;
};

type CommunicationRow = {
  id: string;
  client_id: string;
  case_id: string | null;
  channel: string;
  direction: string;
  subject: string | null;
  summary: string;
  communication_at: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  case_id: string | null;
  entity_type: string;
  action: string;
  message: string;
  created_at: string;
};

type NextYearFollowUpResult = {
  ok: true;
  followUpId: string;
} | {
  ok: false;
  error: string;
};

export type FollowUpActionState = {
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

function normalizeCommunicationAt(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeFollowUp(row: FollowUpJoinedRow, latestCommunicationByKey: Map<string, CommunicationRow>) {
  const client = normalizeRelation(row.clients);
  const assessmentYear = normalizeRelation(row.assessment_years);
  const filingCase = normalizeRelation(row.filing_cases);
  const communicationKey = `${row.client_id}:${row.case_id ?? "client"}`;
  const fallbackCommunicationKey = `${row.client_id}:client`;
  const latestCommunication =
    latestCommunicationByKey.get(communicationKey) ?? latestCommunicationByKey.get(fallbackCommunicationKey) ?? null;

  return {
    ...row,
    clients: client,
    assessment_years: assessmentYear,
    filing_cases: filingCase,
    attentionLevel: deriveFollowUpAttention(row),
    latestCommunication,
  };
}

async function getFollowUpReferenceData(workspaceId: string, clientId?: string) {
  const supabase = await createSupabaseServerClient();

  const clientsQuery = supabase
    .from("clients")
    .select("id, full_name, pan_uppercase, mobile, follow_up_excluded, exclusion_reason")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("full_name", { ascending: true });

  if (clientId) {
    clientsQuery.eq("id", clientId);
  }

  const [{ data: clients, error: clientsError }, { data: assessmentYears, error: yearsError }, { data: cases, error: casesError }] =
    await Promise.all([
      clientsQuery,
      supabase
        .from("assessment_years")
        .select("id, label, start_date, is_current")
        .eq("workspace_id", workspaceId)
        .order("start_date", { ascending: false }),
      supabase
        .from("filing_cases")
        .select("id, client_id, assessment_year_id, case_status, next_action")
        .eq("workspace_id", workspaceId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false }),
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

  return {
    clients: (clients ?? []) as ClientOption[],
    assessmentYears: (assessmentYears ?? []) as AssessmentYearOption[],
    caseOptions: ((cases ?? []) as CaseOption[]).filter((filingCase) => (clientId ? filingCase.client_id === clientId : true)),
  };
}

async function fetchFollowUps(workspaceId: string, filters: FollowUpFilters) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("follow_ups")
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase, mobile, follow_up_excluded, exclusion_reason),
      assessment_years (id, label, start_date, is_current),
      filing_cases (id, case_status, next_action)
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
    throw new Error(`Failed to fetch follow-ups: ${error.message}`);
  }

  const rows = (data ?? []) as FollowUpJoinedRow[];
  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const communicationsQuery = supabase
    .from("communications")
    .select("id, client_id, case_id, channel, direction, subject, summary, communication_at, created_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("communication_at", { ascending: false });

  if (clientIds.length > 0) {
    communicationsQuery.in("client_id", clientIds);
  }

  const { data: communications, error: communicationsError } =
    clientIds.length > 0
      ? await communicationsQuery
      : { data: [], error: null };

  if (communicationsError) {
    throw new Error(`Failed to fetch communications: ${communicationsError.message}`);
  }

  const latestCommunicationByKey = new Map<string, CommunicationRow>();

  for (const communication of (communications ?? []) as CommunicationRow[]) {
    const specificKey = `${communication.client_id}:${communication.case_id ?? "client"}`;
    if (!latestCommunicationByKey.has(specificKey)) {
      latestCommunicationByKey.set(specificKey, communication);
    }

    const fallbackKey = `${communication.client_id}:client`;
    if (!latestCommunicationByKey.has(fallbackKey)) {
      latestCommunicationByKey.set(fallbackKey, communication);
    }
  }

  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  return rows
    .map((row) => normalizeFollowUp(row, latestCommunicationByKey))
    .filter((followUp) => {
      const clientName = followUp.clients?.full_name.toLowerCase() ?? "";
      const pan = followUp.clients?.pan_uppercase.toLowerCase() ?? "";
      const mobile = followUp.clients?.mobile?.toLowerCase() ?? "";
      const nextAction = followUp.next_action?.toLowerCase() ?? "";
      const notes = followUp.notes?.toLowerCase() ?? "";
      const exclusionReason = followUp.exclusion_reason?.toLowerCase() ?? "";
      const ayLabel = followUp.assessment_years?.label.toLowerCase() ?? "";
      const lastCommunication = followUp.latestCommunication?.summary.toLowerCase() ?? "";

      const matchesSearch =
        !searchTerm ||
        clientName.includes(searchTerm) ||
        pan.includes(searchTerm) ||
        mobile.includes(searchTerm) ||
        nextAction.includes(searchTerm) ||
        notes.includes(searchTerm) ||
        exclusionReason.includes(searchTerm) ||
        ayLabel.includes(searchTerm) ||
        lastCommunication.includes(searchTerm);

      const matchesStatus = filters.status ? followUp.status === filters.status : true;
      const matchesAttention = filters.attentionOnly
        ? ["overdue", "due"].includes(followUp.attentionLevel)
        : true;

      return matchesSearch && matchesStatus && matchesAttention;
    })
    .sort((left, right) => {
      const order: Record<FollowUpAttentionLevel, number> = {
        overdue: 0,
        due: 1,
        open: 2,
        excluded: 3,
        completed: 4,
        cancelled: 5,
      };

      const attentionDelta = order[left.attentionLevel] - order[right.attentionLevel];
      if (attentionDelta !== 0) {
        return attentionDelta;
      }

      return `${left.due_date}`.localeCompare(`${right.due_date}`) || `${right.updated_at}`.localeCompare(`${left.updated_at}`);
    });
}

async function fetchClientTimeline(workspaceId: string, clientId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: communications, error: communicationsError }, { data: activity, error: activityError }] = await Promise.all([
    supabase
      .from("communications")
      .select("id, client_id, case_id, channel, direction, subject, summary, communication_at, created_at")
      .eq("workspace_id", workspaceId)
      .eq("client_id", clientId)
      .is("archived_at", null)
      .order("communication_at", { ascending: false })
      .limit(10),
    supabase
      .from("activity_events")
      .select("id, case_id, entity_type, action, message, created_at")
      .eq("workspace_id", workspaceId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (communicationsError) {
    throw new Error(`Failed to fetch communication timeline: ${communicationsError.message}`);
  }

  if (activityError) {
    throw new Error(`Failed to fetch activity timeline: ${activityError.message}`);
  }

  return {
    communications: (communications ?? []) as CommunicationRow[],
    activity: (activity ?? []) as ActivityRow[],
  };
}

export async function getFollowUpsModuleData(filters: FollowUpFilters = {}) {
  const session = await getAuthenticatedWorkspaceSession();
  const referenceData = await getFollowUpReferenceData(session.workspace.id, filters.clientId);
  const followUps = await fetchFollowUps(session.workspace.id, filters);

  const totalFollowUps = followUps.length;
  const pageSize = filters.pageSize ?? 10;
  const requestedPage = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalFollowUps / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedFollowUps = followUps.slice(startIndex, startIndex + pageSize);

  return {
    filters,
    page,
    pageSize,
    totalPages,
    followUps,
    paginatedFollowUps,
    ...referenceData,
    summary: {
      openCount: followUps.filter((followUp) => followUp.status === "open").length,
      dueCount: followUps.filter((followUp) => followUp.attentionLevel === "due").length,
      overdueCount: followUps.filter((followUp) => followUp.attentionLevel === "overdue").length,
      excludedCount: followUps.filter((followUp) => followUp.status === "excluded").length,
      completedCount: followUps.filter((followUp) => followUp.status === "completed").length,
    },
  };
}

export async function getClientCommunicationModuleData(
  clientId: string,
  filters: Omit<FollowUpFilters, "clientId"> = {},
) {
  const session = await getAuthenticatedWorkspaceSession();
  const moduleData = await getFollowUpsModuleData({
    ...filters,
    clientId,
  });
  const timeline = await fetchClientTimeline(session.workspace.id, clientId);

  return {
    ...moduleData,
    timeline,
  };
}

export async function recordCommunicationAction(
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = recordCommunicationSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    caseId: String(formData.get("caseId") ?? "").trim(),
    channel: String(formData.get("channel") ?? "").trim(),
    direction: String(formData.get("direction") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    communicationAt: String(formData.get("communicationAt") ?? "").trim(),
    revalidateTarget: String(formData.get("revalidateTarget") ?? "/follow-up").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const communicationAt = normalizeCommunicationAt(parsed.data.communicationAt);
  if (!communicationAt) {
    return { error: "Choose a valid contact time." };
  }

  if (parsed.data.caseId) {
    const { data: filingCase, error: caseError } = await supabase
      .from("filing_cases")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("id", parsed.data.caseId)
      .eq("client_id", parsed.data.clientId)
      .is("archived_at", null)
      .maybeSingle();

    if (caseError || !filingCase) {
      return { error: "The selected case does not belong to this client." };
    }
  }

  const { data: communication, error: communicationError } = await supabase
    .from("communications")
    .insert({
      workspace_id: session.workspace.id,
      client_id: parsed.data.clientId,
      case_id: parsed.data.caseId || null,
      channel: parsed.data.channel,
      direction: parsed.data.direction,
      subject: parsed.data.subject || null,
      summary: parsed.data.summary,
      communication_at: communicationAt,
      recorded_by: session.user.id,
    })
    .select("id")
    .single();

  if (communicationError || !communication) {
    return { error: `Failed to record contact: ${communicationError?.message ?? "Unknown error"}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: parsed.data.clientId,
    case_id: parsed.data.caseId || null,
    entity_type: "communication",
    entity_id: communication.id,
    action: "communication_recorded",
    message: `${formatCommunicationChannel(parsed.data.channel)} ${formatCommunicationDirection(parsed.data.direction).toLowerCase()} contact recorded.`,
  });

  revalidatePath("/follow-up");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath(`/clients/${parsed.data.clientId}/communications`);
  if (parsed.data.caseId) {
    revalidatePath(`/filing-queue/${parsed.data.caseId}`);
  }
  revalidatePath(parsed.data.revalidateTarget);

  return {
    success: "Contact recorded.",
  };
}

export async function updateFollowUpAction(
  followUpId: string,
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = updateFollowUpSchema.safeParse({
    status: String(formData.get("status") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    nextAction: String(formData.get("nextAction") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    exclusionReason: String(formData.get("exclusionReason") ?? "").trim(),
    revalidateTarget: String(formData.get("revalidateTarget") ?? "/follow-up").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { data: currentFollowUp, error: currentFollowUpError } = await supabase
    .from("follow_ups")
    .select("id, client_id, case_id, status")
    .eq("workspace_id", session.workspace.id)
    .eq("id", followUpId)
    .is("archived_at", null)
    .single();

  if (currentFollowUpError || !currentFollowUp) {
    return { error: "Follow-up record not found." };
  }

  const updatePayload = {
    status: parsed.data.status,
    due_date: parsed.data.dueDate,
    next_action: parsed.data.nextAction || null,
    notes: parsed.data.notes || null,
    completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
    excluded_at: parsed.data.status === "excluded" ? new Date().toISOString() : null,
    exclusion_reason: parsed.data.status === "excluded" ? parsed.data.exclusionReason : null,
  };

  const { error: updateError } = await supabase
    .from("follow_ups")
    .update(updatePayload)
    .eq("workspace_id", session.workspace.id)
    .eq("id", followUpId);

  if (updateError) {
    return { error: `Failed to update the follow-up: ${updateError.message}` };
  }

  const action =
    currentFollowUp.status === "excluded" && parsed.data.status === "open"
      ? "follow_up_reactivated"
      : parsed.data.status === "excluded"
        ? "follow_up_excluded"
        : "follow_up_updated";

  const message =
    action === "follow_up_reactivated"
      ? "Follow-up reactivated."
      : `Follow-up moved to ${formatFollowUpStatus(parsed.data.status).toLowerCase()}.`;

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: currentFollowUp.client_id,
    case_id: currentFollowUp.case_id,
    entity_type: "follow_up",
    entity_id: followUpId,
    action,
    message,
  });

  revalidatePath("/follow-up");
  revalidatePath(`/clients/${currentFollowUp.client_id}`);
  revalidatePath(`/clients/${currentFollowUp.client_id}/communications`);
  if (currentFollowUp.case_id) {
    revalidatePath(`/filing-queue/${currentFollowUp.case_id}`);
  }
  revalidatePath(parsed.data.revalidateTarget);

  return {
    success: parsed.data.status === "excluded" ? "Follow-up excluded." : "Follow-up updated.",
  };
}

export async function reactivateFollowUpAction(
  followUpId: string,
  revalidateTarget: string,
): Promise<FollowUpActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data: currentFollowUp, error: currentFollowUpError } = await supabase
    .from("follow_ups")
    .select("id, client_id, case_id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", followUpId)
    .is("archived_at", null)
    .single();

  if (currentFollowUpError || !currentFollowUp) {
    return { error: "Follow-up record not found." };
  }

  const { error: updateError } = await supabase
    .from("follow_ups")
    .update({
      status: "open",
      completed_at: null,
      excluded_at: null,
      exclusion_reason: null,
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", followUpId);

  if (updateError) {
    return { error: `Failed to reactivate the follow-up: ${updateError.message}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: currentFollowUp.client_id,
    case_id: currentFollowUp.case_id,
    entity_type: "follow_up",
    entity_id: followUpId,
    action: "follow_up_reactivated",
    message: "Follow-up reactivated.",
  });

  revalidatePath("/follow-up");
  revalidatePath(`/clients/${currentFollowUp.client_id}`);
  revalidatePath(`/clients/${currentFollowUp.client_id}/communications`);
  if (currentFollowUp.case_id) {
    revalidatePath(`/filing-queue/${currentFollowUp.case_id}`);
  }
  revalidatePath(revalidateTarget);

  return {
    success: "Follow-up reactivated.",
  };
}

export async function ensureNextYearFollowUpForCase(caseId: string): Promise<NextYearFollowUpResult> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data: filingCase, error: filingCaseError } = await supabase
    .from("filing_cases")
    .select(`
      id,
      workspace_id,
      client_id,
      assessment_year_id,
      follow_up_excluded,
      clients!inner (follow_up_excluded, exclusion_reason),
      assessment_years!inner (label, start_date)
    `)
    .eq("workspace_id", session.workspace.id)
    .eq("id", caseId)
    .is("archived_at", null)
    .single();

  if (filingCaseError || !filingCase) {
    return { ok: false, error: "Filing case not found for annual follow-up creation." };
  }

  const currentAssessmentYear = normalizeRelation(
    filingCase.assessment_years as { label: string; start_date: string } | { label: string; start_date: string }[] | null,
  );
  const client = normalizeRelation(
    filingCase.clients as { follow_up_excluded: boolean; exclusion_reason: string | null } | { follow_up_excluded: boolean; exclusion_reason: string | null }[] | null,
  );

  if (!currentAssessmentYear) {
    return { ok: false, error: "Current assessment year could not be resolved for this case." };
  }

  const { data: nextAssessmentYear, error: nextAssessmentYearError } = await supabase
    .from("assessment_years")
    .select("id, label, start_date")
    .eq("workspace_id", session.workspace.id)
    .gt("start_date", currentAssessmentYear.start_date)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextAssessmentYearError) {
    return { ok: false, error: "Failed to resolve the next configured assessment year." };
  }

  if (!nextAssessmentYear) {
    return { ok: false, error: "Configure the next assessment year before marking this case as completed." };
  }

  const { data: existingFollowUps, error: existingFollowUpError } = await supabase
    .from("follow_ups")
    .select("id, status, due_date")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", filingCase.client_id)
    .eq("assessment_year_id", nextAssessmentYear.id)
    .eq("follow_up_type", "next_year")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingFollowUpError) {
    return { ok: false, error: "Failed to inspect existing annual follow-up records." };
  }

  const existingFollowUp = existingFollowUps?.[0] ?? null;
  const shouldExclude = Boolean(client?.follow_up_excluded || filingCase.follow_up_excluded);
  const exclusionReason = client?.exclusion_reason?.trim() || "Excluded from annual follow-up.";

  if (existingFollowUp) {
    if (existingFollowUp.status === "excluded") {
      return { ok: true, followUpId: existingFollowUp.id };
    }

    const { error: updateError } = await supabase
      .from("follow_ups")
      .update({
        status: shouldExclude ? "excluded" : "open",
        due_date: nextAssessmentYear.start_date,
        next_action: `Start AY ${nextAssessmentYear.label} outreach.`,
        completed_at: null,
        excluded_at: shouldExclude ? new Date().toISOString() : null,
        exclusion_reason: shouldExclude ? exclusionReason : null,
      })
      .eq("workspace_id", session.workspace.id)
      .eq("id", existingFollowUp.id);

    if (updateError) {
      return { ok: false, error: `Failed to enable the next-year follow-up: ${updateError.message}` };
    }

    revalidatePath("/follow-up");
    return { ok: true, followUpId: existingFollowUp.id };
  }

  const { data: createdFollowUp, error: createError } = await supabase
    .from("follow_ups")
    .insert({
      workspace_id: session.workspace.id,
      client_id: filingCase.client_id,
      case_id: null,
      assessment_year_id: nextAssessmentYear.id,
      follow_up_type: "next_year",
      status: shouldExclude ? "excluded" : "open",
      due_date: nextAssessmentYear.start_date,
      next_action: `Start AY ${nextAssessmentYear.label} outreach.`,
      excluded_at: shouldExclude ? new Date().toISOString() : null,
      exclusion_reason: shouldExclude ? exclusionReason : null,
    })
    .select("id")
    .single();

  if (createError || !createdFollowUp) {
    return { ok: false, error: `Failed to create the next-year follow-up: ${createError?.message ?? "Unknown error"}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: filingCase.client_id,
    case_id: caseId,
    entity_type: "follow_up",
    entity_id: createdFollowUp.id,
    action: "follow_up_created",
    message: shouldExclude
      ? `Next-year follow-up excluded for AY ${nextAssessmentYear.label}.`
      : `Next-year follow-up created for AY ${nextAssessmentYear.label}.`,
  });

  revalidatePath("/follow-up");

  return { ok: true, followUpId: createdFollowUp.id };
}
