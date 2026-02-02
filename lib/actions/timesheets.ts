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
  const hours = parseFloat(formData.get('hours') as string)
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

  // INSERT into 'time_entries' (Correct Table)
  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    tenant_id: profile.tenant_id,
    project_id: projectId,
    entry_date: dateStr,                // Correct Column: entry_date
    hours: hours,
    minutes: 0,                         // Defaulting minutes to 0
    description: description,
    is_additional_work: isAdditionalWork,
    additional_work_description: isAdditionalWork ? additionalWorkDesc : null, // Correct Column
    status: 'draft',                    // Default status per your SQL
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

export async function getPendingApprovals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

  const { data } = await supabase
    .from('time_entries') // Updated Table
    .select('*, profiles(first_name, last_name, email), projects(name)')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'submitted') // Usually Managers approve 'submitted' items
    .order('entry_date', { ascending: false })

  // Map 'entry_date' to 'date' for frontend compatibility if needed, 
  // or ensure frontend reads 'entry_date'
  return data?.map(d => ({ ...d, date: d.entry_date })) || []
}

export async function updateTimesheetStatus(id: string, status: 'approved' | 'rejected') {
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

  const { error } = await supabase.from('time_entries').update(updatePayload).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/my')
  return { success: true }
}

export async function getReportData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

  const { data } = await supabase
    .from('time_entries') // Updated Table
    .select('*, profiles(first_name, last_name), projects(name, client_name)')
    .eq('tenant_id', profile.tenant_id)
    .neq('status', 'rejected')
    .order('entry_date', { ascending: false })

  return data?.map(d => ({ ...d, date: d.entry_date })) || []
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

  const { error } = await supabase.from('time_entries').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/timesheets/my')
  return { success: true }
}
