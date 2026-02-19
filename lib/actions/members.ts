'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMemberToProject(projectId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Get Tenant ID (Required by your DB schema)
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

  if (!profile) return { error: 'Profile not found' }

  // 2. Insert into 'project_memberships' (Your existing table)
  // Note: We use 'User' for the role as per your DB Enum constraints
  const { error } = await supabase.from('project_memberships').insert({
    tenant_id: profile.tenant_id,
    project_id: projectId,
    user_id: userId,
    role: 'User',
    created_by: user.id
  })

  if (error) {
    console.error('Add Member Error:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/projects/${projectId}`)
  return { success: true }
}

export async function removeMemberFromProject(membershipId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('project_memberships').delete().eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/projects/${projectId}`)
  return { success: true }
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient()

  // Fetch membership + profile details
  const { data } = await supabase
    .from('project_memberships')
    .select('*, profiles(id, first_name, last_name, email)')
    .eq('project_id', projectId)

  return data || []
}

export async function getAvailableUsers(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get requester's active company context
  const { data: profile } = await supabase.from('profiles').select('current_company_id').eq('id', user.id).single()

  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if (profile?.current_company_id) {
    query = query.eq('current_company_id', profile.current_company_id)
  }

  const { data } = await query.order('first_name')
  return data || []
}
