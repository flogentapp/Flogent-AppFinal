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

import { getUserPermissions } from './permissions'

export async function getPendingApprovals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) return []

  const { data: profile } = await supabase.from('profiles').select('tenant_id, current_company_id').eq('id', user.id).single()
  if (!profile) return []

  const activeCompanyId = profile.current_company_id

  let query = supabase
    .from('time_entries')
    .select('*, profiles(first_name, last_name, email), projects(*)')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'submitted')

  const allowedProjectIds = new Set<string>()

  if (!permissions.isOwner) {
    // 1. If CEO of some companies, find projects in those companies
    if (permissions.isCEO) {
      const { data: ceoProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('company_id', permissions.managedCompanyIds)

      ceoProjects?.forEach(p => {
        // If an active company is set, only allow projects within it.
        // Otherwise allow overall managed projects.
        if (!activeCompanyId || p.company_id === activeCompanyId) {
          allowedProjectIds.add(p.id)
        }
      })
    }

    // 2. If Dept Head
    if (permissions.isDepartmentHead) {
      const { data: deptProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('department_id', permissions.managedDepartmentIds)

      deptProjects?.forEach(p => {
        if (!activeCompanyId || p.company_id === activeCompanyId) {
          allowedProjectIds.add(p.id)
        }
      })
    }

    // 3. If Project Leader
    if (permissions.isProjectLeader) {
      // Find projects I lead (must still belong to active company if set)
      const { data: ledProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('id', permissions.managedProjectIds)

      ledProjects?.forEach(p => {
        if (!activeCompanyId || p.company_id === activeCompanyId) {
          allowedProjectIds.add(p.id)
        }
      })
    }

    const finalIds = Array.from(allowedProjectIds)
    if (finalIds.length > 0) {
      query = query.in('project_id', finalIds)
    } else {
      return [] // No managed projects in this company
    }
  } else if (activeCompanyId) {
    // Owner case - still scope to active company if set
    const { data: companyProjs } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', activeCompanyId)

    query = query.in('project_id', companyProjs?.map(p => p.id) || [])
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

  const { data: profile } = await supabase.from('profiles').select('tenant_id, current_company_id').eq('id', user.id).single()
  if (!profile) return []

  const activeCompanyId = profile.current_company_id

  let query = supabase
    .from('time_entries')
    .select('*, profiles(first_name, last_name), projects(*, departments(name))')
    .eq('tenant_id', profile.tenant_id)

  const allowedProjectIds = new Set<string>()

  if (!permissions.isOwner) {
    // 1. CEO scoping
    if (permissions.isCEO) {
      const { data: ceoProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('company_id', permissions.managedCompanyIds)
      ceoProjects?.forEach(p => {
        if (!activeCompanyId || p.company_id === activeCompanyId) allowedProjectIds.add(p.id)
      })
    }

    // 2. Dept Head scoping
    if (permissions.isDepartmentHead) {
      const { data: deptProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('department_id', permissions.managedDepartmentIds)
      deptProjects?.forEach(p => {
        if (!activeCompanyId || p.company_id === activeCompanyId) allowedProjectIds.add(p.id)
      })
    }

    // 3. Project Leader scoping
    if (permissions.isProjectLeader) {
      const { data: ledProjects } = await supabase
        .from('projects')
        .select('id, company_id')
        .in('id', permissions.managedProjectIds)
      ledProjects?.forEach(p => {
        if (!activeCompanyId || p.company_id === activeCompanyId) allowedProjectIds.add(p.id)
      })
    }

    const finalIds = Array.from(allowedProjectIds)
    if (finalIds.length > 0) {
      query = query.in('project_id', finalIds)
    } else {
      return []
    }
  } else if (activeCompanyId) {
    // Owner case - scope to active company
    const { data: compProjIds } = await supabase.from('projects').select('id').eq('company_id', activeCompanyId)
    query = query.in('project_id', compProjIds?.map(p => p.id) || [])
  }

  const { data } = await query.order('entry_date', { ascending: false })

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
