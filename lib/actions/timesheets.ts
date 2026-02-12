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
    status: 'draft',
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

import { getUserPermissions } from './permissions'

export async function getPendingApprovals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return []

  let query = supabase
    .from('time_entries')
    .select('*, profiles(first_name, last_name, email), projects(*)')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'submitted')

  if (!permissions.isOwner && !permissions.isCEO) {
    const allowedProjectIds = new Set<string>()

    if (permissions.isProjectLeader) {
      permissions.managedProjectIds.forEach(id => allowedProjectIds.add(id))
    }

    if (permissions.isDepartmentHead) {
      const { data: deptProjects } = await supabase
        .from('projects')
        .select('id')
        .in('department_id', permissions.managedDepartmentIds)
      deptProjects?.forEach(p => allowedProjectIds.add(p.id))
    }

    const finalIds = Array.from(allowedProjectIds)
    if (finalIds.length > 0) {
      query = query.in('project_id', finalIds)
    } else {
      return []
    }
  }

  const { data } = await query.order('entry_date', { ascending: false })

  return data?.map(d => ({
    ...d,
    date: d.entry_date,
    hours: Number(d.hours) + (Number(d.minutes) / 60)
  })) || []
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
  revalidatePath('/timesheets/reports')
  revalidatePath('/timesheets/my')
  return { success: true }
}

export async function getReportData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return []

  let query = supabase
    .from('time_entries')
    .select('*, profiles(first_name, last_name), projects(*, departments(name))')
    .eq('tenant_id', profile.tenant_id)
    .neq('status', 'rejected')

  if (!permissions.isOwner && !permissions.isCEO) {
    const allowedProjectIds = new Set<string>()

    if (permissions.isProjectLeader) {
      permissions.managedProjectIds.forEach(id => allowedProjectIds.add(id))
    }

    if (permissions.isDepartmentHead) {
      const { data: deptProjects } = await supabase
        .from('projects')
        .select('id')
        .in('department_id', permissions.managedDepartmentIds)
      deptProjects?.forEach(p => allowedProjectIds.add(p.id))
    }

    const finalIds = Array.from(allowedProjectIds)
    if (finalIds.length > 0) {
      query = query.in('project_id', finalIds)
    } else {
      return []
    }
  }

  const { data } = await query.order('entry_date', { ascending: false })

  return data?.map(d => ({
    ...d,
    date: d.entry_date,
    hours: Number(d.hours) + (Number(d.minutes) / 60)
  })) || []
}


export async function submitWeek(dateISO: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use the RPC function we added in migrations
  const { error } = await supabase.rpc('submit_week', {
    p_user_id: user.id,
    p_date: dateISO
  })

  if (error) return { error: error.message }

  revalidatePath('/timesheets/my')
  revalidatePath('/timesheets/approvals')
  revalidatePath('/timesheets/reports')
  return { success: true }
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

  // Verify status before deleting
  const { data: entry } = await supabase
    .from('time_entries')
    .select('status')
    .eq('id', id)
    .single()

  if (!entry) return { error: 'Entry not found' }
  if (entry.status !== 'draft' && entry.status !== 'rejected') {
    return { error: 'Cannot delete a submitted or approved entry.' }
  }

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

  // Verify status before updating
  const { data: entry } = await supabase
    .from('time_entries')
    .select('status')
    .eq('id', id)
    .single()

  if (!entry) return { error: 'Entry not found' }
  if (entry.status !== 'draft' && entry.status !== 'rejected') {
    return { error: 'Cannot edit a submitted or approved entry.' }
  }

  const { error } = await supabase.from('time_entries').update({
    project_id: projectId,
    entry_date: dateStr,
    hours: hours,
    description: description,
    is_additional_work: isAdditionalWork,
    additional_work_description: isAdditionalWork ? additionalWorkDesc : null,
    status: 'draft', // Reset to draft if it was rejected
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
