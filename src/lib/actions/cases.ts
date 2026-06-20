'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  UpdateCaseInput,
  updateCaseSchema,
  TransitionCaseInput,
  transitionCaseSchema,
} from '@/lib/validations/cases';
import { VALID_TRANSITIONS, CaseStatus } from '@/lib/constants/workflows';
import { ensureNextYearFollowUpForCase } from '@/lib/actions/follow-ups';
import { getAuthenticatedWorkspaceSession } from '@/lib/auth/session';

type FilingQueueQueryRow = {
  id: string;
  case_status: string;
  next_action: string | null;
  due_date: string | null;
  updated_at: string;
  blocker_code: string | null;
  blocker_note: string | null;
  clients: {
    id: string;
    full_name: string;
    pan_uppercase: string;
    mobile: string | null;
  }[];
  assessment_years: {
    id: string;
    label: string;
  }[];
};

export async function getFilingQueueCases(params: {
  search?: string;
  ay_label?: string;
  status?: string;
  scope?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { search, ay_label, status, scope, page = 1, pageSize = 20 } = params;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.min(Math.max(pageSize, 1), 100) : 20;
  const today = new Date().toISOString().slice(0, 10);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from('filing_cases')
    .select(`
      id,
      case_status,
      next_action,
      due_date,
      updated_at,
      blocker_code,
      blocker_note,
      clients!inner (id, full_name, pan_uppercase, mobile),
      assessment_years!inner (id, label)
    `, { count: 'exact' })
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (search) {
    const searchUpper = search.toUpperCase();
    query = query.or(
      `full_name.ilike.%${search}%,pan_uppercase.ilike.%${searchUpper}%`,
      { foreignTable: 'clients' }
    );
  }

  if (ay_label) {
    query = query.eq('assessment_years.label', ay_label);
  }

  if (status) {
    query = query.eq('case_status', status);
  }

  if (scope !== 'attention') {
    // Non-attention scopes keep the canonical filing queue dataset and pagination.
  } else {
    query = query.or(
      `blocker_code.not.is.null,blocker_note.not.is.null,and(due_date.lt.${today},case_status.not.in.(Filed,Cancelled))`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching filing queue cases:', error);
    throw new Error('Failed to fetch filing cases');
  }
  const cases = ((data ?? []) as FilingQueueQueryRow[]).map((filingCase) => ({
    id: filingCase.id,
    case_status: filingCase.case_status,
    next_action: filingCase.next_action,
    due_date: filingCase.due_date,
    updated_at: filingCase.updated_at,
    clients: filingCase.clients[0] ?? null,
    assessment_years: filingCase.assessment_years[0] ?? null,
    blocker: filingCase.blocker_note?.trim() || filingCase.blocker_code?.trim() || null,
  }));
  const scopedCount = count ?? cases.length;

  return {
    cases,
    count: scopedCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(scopedCount / safePageSize)),
  };
}

export async function getFilingCase(caseId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('filing_cases')
    .select(`
      *,
      clients (*),
      assessment_years (*),
      case_status_history (
        id,
        from_status,
        to_status,
        reason,
        changed_at,
        changed_by
      )
    `)
    .eq('id', caseId)
    .single();

  if (error) {
    console.error('Error fetching filing case:', error);
    return null;
  }

  // Sort history descending by changed_at
  if (data.case_status_history) {
    data.case_status_history.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
  }

  return data;
}

export async function getClientFilingCases(clientId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('filing_cases')
    .select(`
      *,
      assessment_years (label)
    `)
    .eq('client_id', clientId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client filing cases:', error);
    return [];
  }

  return data;
}

export async function updateFilingCaseDetails(
  caseId: string,
  formData: UpdateCaseInput
) {
  const supabase = await createSupabaseServerClient();
  const validated = updateCaseSchema.safeParse(formData);

  if (!validated.success) {
    return {
      error: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { data: currentCase, error: caseError } = await supabase
    .from('filing_cases')
    .select('client_id')
    .eq('id', caseId)
    .single();

  if (caseError || !currentCase) {
    return { error: 'Case not found' };
  }

  const { error } = await supabase
    .from('filing_cases')
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  if (error) {
    console.error('Error updating case details:', error);
    return { error: 'Failed to update case details' };
  }

  revalidatePath(`/filing-queue/${caseId}`);
  revalidatePath(`/clients/${currentCase.client_id}`);
  return { success: true };
}

export async function transitionFilingCase(
  caseId: string,
  formData: TransitionCaseInput
) {
  const supabase = await createSupabaseServerClient();
  const validated = transitionCaseSchema.safeParse(formData);

  if (!validated.success) {
    return {
      error: 'Validation failed',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { toStatus, reason } = validated.data;

  // 1. Get current case
  const { data: currentCase, error: caseError } = await supabase
    .from('filing_cases')
    .select('case_status, workspace_id, client_id')
    .eq('id', caseId)
    .single();

  if (caseError || !currentCase) {
    return { error: 'Case not found' };
  }

  const currentStatus = currentCase.case_status as CaseStatus;

  // 2. Validate transition
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(toStatus)) {
    return { error: `Invalid transition from ${currentStatus} to ${toStatus}` };
  }

  if (toStatus === 'Filed') {
    const followUpResult = await ensureNextYearFollowUpForCase(caseId);
    if (!followUpResult.ok) {
      return { error: followUpResult.error };
    }
  }

  // 3. User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // 4. Update status and insert history
  const { error: updateError } = await supabase
    .from('filing_cases')
    .update({
      case_status: toStatus,
      completed_at: toStatus === 'Filed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  if (updateError) {
    console.error('Error updating case status:', updateError);
    return { error: 'Failed to update case status' };
  }

  const { error: historyError } = await supabase
    .from('case_status_history')
    .insert({
      workspace_id: currentCase.workspace_id,
      case_id: caseId,
      from_status: currentStatus,
      to_status: toStatus,
      reason: reason || null,
      changed_by: user.id,
    });

  if (historyError) {
    console.error('Failed to insert status history:', historyError);
  }

  revalidatePath(`/filing-queue/${caseId}`);
  revalidatePath(`/clients/${currentCase.client_id}`);
  revalidatePath('/follow-up');

  return { success: true };
}

// ── Assessment years with case state ──────────────────────────────────────────

export async function getClientAssessmentYearsWithCases(clientId: string) {
  const supabase = await createSupabaseServerClient();

  // Fetch all workspace assessment years
  const { data: years, error: yearsError } = await supabase
    .from('assessment_years')
    .select('id, label, start_date, end_date, is_current, is_open')
    .order('start_date', { ascending: false });

  if (yearsError) {
    console.error('Error fetching assessment years:', yearsError);
    return { years: [], cases: [] };
  }

  // Fetch existing cases for this client
  const { data: cases, error: casesError } = await supabase
    .from('filing_cases')
    .select('id, assessment_year_id, case_status, next_action, due_date, updated_at')
    .eq('client_id', clientId)
    .is('archived_at', null);

  if (casesError) {
    console.error('Error fetching client cases:', casesError);
    return { years: years ?? [], cases: [] };
  }

  return {
    years: years ?? [],
    cases: cases ?? [],
  };
}

export type CreateCaseActionState = {
  error?: string;
  success?: string;
  caseId?: string;
};

export async function createFilingCaseAction(
  clientId: string,
  assessmentYearId: string,
): Promise<CreateCaseActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  if (!clientId || !assessmentYearId) {
    return { error: 'Client and assessment year are required.' };
  }

  // Verify client belongs to this workspace
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('workspace_id', session.workspace.id)
    .eq('id', clientId)
    .is('archived_at', null)
    .single();

  if (clientError || !client) {
    return { error: 'Client not found in the active workspace.' };
  }

  // Verify AY belongs to this workspace
  const { data: ay, error: ayError } = await supabase
    .from('assessment_years')
    .select('id, label')
    .eq('workspace_id', session.workspace.id)
    .eq('id', assessmentYearId)
    .single();

  if (ayError || !ay) {
    return { error: 'Assessment year not found in the active workspace.' };
  }

  // Enforce one-case-per-client-per-AY
  const { data: existing, error: existingError } = await supabase
    .from('filing_cases')
    .select('id')
    .eq('workspace_id', session.workspace.id)
    .eq('client_id', clientId)
    .eq('assessment_year_id', assessmentYearId)
    .is('archived_at', null)
    .maybeSingle();

  if (existingError) {
    return { error: 'Could not check for existing cases. Please try again.' };
  }

  if (existing) {
    return { error: `A filing case for ${ay.label} already exists for this client.` };
  }

  // Create case at initial status
  const initialStatus: CaseStatus = 'New Client';

  const { data: newCase, error: insertError } = await supabase
    .from('filing_cases')
    .insert({
      workspace_id: session.workspace.id,
      client_id: clientId,
      assessment_year_id: assessmentYearId,
      case_status: initialStatus,
    })
    .select('id')
    .single();

  if (insertError || !newCase) {
    console.error('Error creating filing case:', insertError);
    return { error: `Failed to create the filing case: ${insertError?.message ?? 'Unknown error'}` };
  }

  // Insert initial status history
  await supabase.from('case_status_history').insert({
    workspace_id: session.workspace.id,
    case_id: newCase.id,
    from_status: null,
    to_status: initialStatus,
    reason: 'Case created.',
    changed_by: session.user.id,
  });

  // Record activity
  await supabase.from('activity_events').insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: clientId,
    case_id: newCase.id,
    entity_type: 'filing_case',
    entity_id: newCase.id,
    action: 'case_created',
    message: `Filing case for ${ay.label} created.`,
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/assessment-years`);
  revalidatePath(`/clients/${clientId}/filings`);
  revalidatePath('/filing-queue');

  return { success: `Filing case for ${ay.label} created.`, caseId: newCase.id };
}
