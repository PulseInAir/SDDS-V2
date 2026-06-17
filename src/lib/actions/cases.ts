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

export async function getFilingQueueCases(params: {
  search?: string;
  ay_label?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { search, ay_label, status, page = 1, pageSize = 20 } = params;

  let query = supabase
    .from('filing_cases')
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase, mobile),
      assessment_years!inner (id, label)
    `, { count: 'exact' })
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

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

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching filing queue cases:', error);
    throw new Error('Failed to fetch filing cases');
  }

  return {
    cases: data,
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
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

  return { success: true };
}
