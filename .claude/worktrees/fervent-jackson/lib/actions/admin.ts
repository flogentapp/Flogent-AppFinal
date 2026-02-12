'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSupabaseCall } from '../supabase/logger'

// 1. Assign User to Project
export async function assignUserToProject(
  userId: string,
  projectId: string,
  role: 'User' | 'ProjectLeader'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if membership exists
  const { data: existing, error: existingErr } = await supabase
    .from('project_memberships')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingErr) return { error: existingErr.message }

  if (existing?.id) {
    // Update existing role
    const { error: updErr } = await supabase
      .from('project_memberships')
      .update({ role })
      .eq('id', existing.id)

    if (updErr) return { error: updErr.message }
  } else {
    // Insert new membership
    const { error: insErr } = await supabase
      .from('project_memberships')
      .insert({ project_id: projectId, user_id: userId, role })

    if (insErr) return { error: insErr.message }
  }

  // Force refresh
  revalidatePath('/', 'layout')
  return { success: true }
}

// 2. Update Approval Matrix
export async function updateApprovalPolicy(rules: any, enabled: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    // Get Tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    // Upsert Policy
    const { error } = await supabase
        .from('approval_policies')
        .upsert({
            tenant_id: profile.tenant_id,
            rules: rules,
            approvals_enabled: enabled,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

    if (error) {
        console.error('Policy Update Error:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/approvals')
    return { success: true }
}

// 3. Assign Department Head
export async function assignDepartmentHead(departmentId: string, userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Get Tenant ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    // 2. Assign the Role
    // We insert a new role assignment. 
    const { error } = await supabase
        .from('user_role_assignments')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: userId,
            role: 'DepartmentHead',
            scope_type: 'department',
            scope_id: departmentId
        })

    if (error) {
        console.error('Error assigning head:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/departments')
    return { success: true }
}