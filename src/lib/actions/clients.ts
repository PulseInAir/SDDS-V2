'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { clientFormSchema, ClientFormData } from '@/lib/validations/clients'

export async function getClients(params: {
  search?: string
  page?: number
  pageSize?: number
  status?: string
  sortBy?: string
}) {
  const supabase = await createSupabaseServerClient()
  const { search, page = 1, pageSize = 20, status = 'all', sortBy = 'name_asc' } = params

  // Determine if status is a case status filter
  const isCaseStatus = ['new_client', 'filing_queue', 'filed', 'on_hold', 'cancelled'].includes(status)
  const statusMap: Record<string, string> = {
    new_client: 'New Client',
    filing_queue: 'Filing Queue',
    filed: 'Filed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled'
  }

  const { data: currentAY } = await supabase
    .from('assessment_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  let query;

  if (isCaseStatus) {
    query = supabase
      .from('clients')
      .select('*, filing_cases!inner(case_status, assessment_year_id)', { count: 'exact' })
      .is('archived_at', null)
      .eq('filing_cases.case_status', statusMap[status])
    if (currentAY) {
      query = query.eq('filing_cases.assessment_year_id', currentAY.id)
    }
  } else {
    query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .is('archived_at', null)
    if (status === 'active') {
      query = query.eq('active', true)
    } else if (status === 'inactive') {
      query = query.eq('active', false)
    } else if (status === 'excluded') {
      query = query.eq('follow_up_excluded', true)
    }
  }

  if (search) {
    // Search across name, PAN, mobile, and client ID
    const searchUpper = search.toUpperCase()
    query = query.or(
      `full_name.ilike.%${search}%,pan_uppercase.ilike.%${searchUpper}%,mobile.ilike.%${search}%,client_id_code.ilike.%${search}%`
    )
  }

  // Sorting
  if (sortBy === 'name_asc') {
    query = query.order('full_name', { ascending: true })
  } else if (sortBy === 'name_desc') {
    query = query.order('full_name', { ascending: false })
  } else if (sortBy === 'created_desc') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'created_asc') {
    query = query.order('created_at', { ascending: true })
  } else if (sortBy === 'client_id_asc') {
    query = query.order('client_id_code', { ascending: true })
  } else if (sortBy === 'client_id_desc') {
    query = query.order('client_id_code', { ascending: false })
  } else if (sortBy === 'status_active_first') {
    query = query.order('active', { ascending: false }).order('full_name', { ascending: true })
  } else if (sortBy === 'status_inactive_first') {
    query = query.order('active', { ascending: true }).order('full_name', { ascending: true })
  } else {
    query = query.order('full_name', { ascending: true })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching clients:', error)
    throw new Error('Failed to fetch clients')
  }

  // Fetch metrics for info cards
  const { data: metricsData, error: metricsError } = await supabase
    .from('clients')
    .select('active, follow_up_excluded')
    .is('archived_at', null)

  let metrics = {
    total: 0,
    active: 0,
    inactive: 0,
    excluded: 0,
  }

  if (!metricsError && metricsData) {
    metrics = {
      total: metricsData.length,
      active: metricsData.filter(c => c.active).length,
      inactive: metricsData.filter(c => !c.active).length,
      excluded: metricsData.filter(c => c.follow_up_excluded).length,
    }
  }

  return {
    clients: data,
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    metrics,
  }
}

export async function getClientById(id: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client by id:', error)
    return null
  }

  return data
}

export async function createClientAction(formData: ClientFormData) {
  const supabase = await createSupabaseServerClient()

  // Ensure user is authenticated and get workspace_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: workspaceMembers, error: wmError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (wmError || !workspaceMembers) {
    return { error: 'Workspace not found' }
  }

  const validatedData = clientFormSchema.safeParse(formData)

  if (!validatedData.success) {
    return { error: 'Validation failed', errors: validatedData.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        ...validatedData.data,
        workspace_id: workspaceMembers.workspace_id,
        // Optional string fields should be mapped to null if empty
        date_of_birth: validatedData.data.date_of_birth || null,
        mobile: validatedData.data.mobile || null,
        email: validatedData.data.email || null,
        address: validatedData.data.address || null,
        family_group: validatedData.data.family_group || null,
        exclusion_reason: validatedData.data.exclusion_reason || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    if (error.code === '23505') { // Unique violation
      return { error: 'A client with this PAN already exists in this workspace.' }
    }
    return { error: 'Failed to create client' }
  }

  revalidatePath('/clients')
  return { success: true, client: data }
}

export async function updateClientAction(id: string, formData: ClientFormData) {
  const supabase = await createSupabaseServerClient()

  const validatedData = clientFormSchema.safeParse(formData)

  if (!validatedData.success) {
    return { error: 'Validation failed', errors: validatedData.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from('clients')
    .update({
      ...validatedData.data,
      date_of_birth: validatedData.data.date_of_birth || null,
      mobile: validatedData.data.mobile || null,
      email: validatedData.data.email || null,
      address: validatedData.data.address || null,
      family_group: validatedData.data.family_group || null,
      exclusion_reason: validatedData.data.exclusion_reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    if (error.code === '23505') {
      return { error: 'A client with this PAN already exists.' }
    }
    return { error: 'Failed to update client' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true, client: data }
}
