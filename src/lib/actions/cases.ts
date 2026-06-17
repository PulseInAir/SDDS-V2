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
