'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logTime(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Extract Form Data
  const projectId = formData.get('project_id') as string
  const dateStr = formData.get('date') as string
  const hours = parseFloat((formData.get('hours') as string).replace(',', '.'))
  const description = formData.get('description') as string

  // Additional Work Logic
  const isAdditionalWork = formData.get('is_additional_work') === 'on'
  const additionalWorkDesc = formData.get('additional_work_reason') as string // Form sends 'reason', DB needs 'description'

  if (!projectId || !dateStr || !hours) return { error: 'Missing fields' }

  // Validation
  if (isAdditionalWork && !additionalWorkDesc) {
    return { error: 'Please explain why this is Additional Work.' }
  }

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found' }

  // INSERT into 'time_entries' (Directly storing the decimal hours)
  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    tenant_id: profile.tenant_id,
    project_id: projectId,
    entry_date: dateStr,
    hours: hours,                       // Store raw decimal (e.g. 4.12)
    minutes: 0,                         // Reset minutes for new decimal entries
    description: description,
    is_additional_work: isAdditionalWork,
    additional_work_description: isAdditionalWork ? additionalWorkDesc : null,
    status: 'submitted',
    created_by: user.id
  })

  if (error) {
    console.error('Log Time Error:', error)
    return { error: error.message }
  }

  revalidatePath('/timesheets/my')
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/reports')
  return { success: true }
}

// --- READ FUNCTIONS (Updated to read from 'time_entries') ---

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPermissions } from './permissions'

export async function getPendingApprovals() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return []

  // DEV FOLDER: Fetch all submitted entries for the entire tenant
  const { data } = await adminClient
    .from('time_entries')
    .select('*, profiles:user_id(first_name, last_name, email), projects(*, departments(name))')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'submitted')
    .order('entry_date', { ascending: false })

  return data?.map(d => ({
    ...d,
    date: d.entry_date,
    hours: Number(d.hours) + (Number(d.minutes) / 60)
  })) || []
}

export async function updateTimesheetStatus(id: string, status: 'approved' | 'rejected') {
  const adminClient = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const updatePayload: any = {
    status: status,
    updated_at: new Date().toISOString(),
    updated_by: user?.id
  }

  if (status === 'approved') {
    updatePayload.approved_at = new Date().toISOString()
    updatePayload.approved_by = user?.id
  } else if (status === 'rejected') {
    updatePayload.rejected_at = new Date().toISOString()
    updatePayload.rejected_by = user?.id
  }

  // Use admin client in dev to ensure managers can update any entry in the tenant
  const { error } = await adminClient.from('time_entries').update(updatePayload).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/reports')
  revalidatePath('/timesheets/my')
  return { success: true }
}

export async function getReportData() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return []

  // DEV FOLDER: Fetch all tenant entries for reporting
  const { data } = await adminClient
    .from('time_entries')
    .select('*, profiles:user_id(first_name, last_name), projects(*, departments(name))')
    .eq('tenant_id', profile.tenant_id)
    .order('entry_date', { ascending: false })

  return data?.map(d => ({
    ...d,
    date: d.entry_date,
    hours: Number(d.hours) + (Number(d.minutes) / 60)
  })) || []
}



export async function approveTimeEntry(id: string) {
  return updateTimesheetStatus(id, 'approved')
}


export async function rejectTimeEntry(id: string, reason?: string) {
  return updateTimesheetStatus(id, 'rejected')
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: entry } = await supabase.from('time_entries').select('id').eq('id', id).single()

  if (!entry) return { error: 'Entry not found' }

  const { error } = await supabase.from('time_entries').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/timesheets/my')
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/reports')
  return { success: true }
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Extract Form Data
  const projectId = formData.get('project_id') as string
  const dateStr = formData.get('date') as string
  const hours = parseFloat((formData.get('hours') as string).replace(',', '.'))
  const description = formData.get('description') as string

  // Additional Work Logic
  const isAdditionalWork = formData.get('is_additional_work') === 'on'
  const additionalWorkDesc = formData.get('additional_work_reason') as string

  if (!projectId || !dateStr || !hours) return { error: 'Missing fields' }

  // Validation
  if (isAdditionalWork && !additionalWorkDesc) {
    return { error: 'Please explain why this is Additional Work.' }
  }

  const { data: entry } = await supabase.from('time_entries').select('id').eq('id', id).single()

  if (!entry) return { error: 'Entry not found' }

  const { error } = await supabase.from('time_entries').update({
    project_id: projectId,
    entry_date: dateStr,
    hours: hours,
    description: description,
    is_additional_work: isAdditionalWork,
    additional_work_description: isAdditionalWork ? additionalWorkDesc : null,
    status: 'submitted', // Always submitted so it's visible in approvals
    updated_at: new Date().toISOString(),
    updated_by: user.id
  }).eq('id', id)

  if (error) {
    console.error('Update Time Error:', error)
    return { error: error.message }
  }

  revalidatePath('/timesheets/my')
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/reports')
  return { success: true }
}
