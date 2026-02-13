'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSupabaseCall } from '../supabase/logger'

const ADMIN_ROLES = ['TenantOwner', 'CEO', 'Admin']

async function requireAdminRole(supabase: any, userId: string, tenantId: string) {
    const { data: roles } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .in('scope_type', ['system', 'tenant'])

    const hasAdminRole = roles?.some((r: any) => ADMIN_ROLES.includes(r.role))
    if (!hasAdminRole) {
        return { error: 'Unauthorized: Admin access required' }
    }
    return null
}

// 1. Assign User to Project
export async function assignUserToProject(
  userId: string,
  projectId: string,
  role: 'User' | 'ProjectLeader'
) {
  if (!userId || !projectId) return { error: 'User ID and Project ID are required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get tenant context
  const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

  if (!profile?.tenant_id) return { error: 'No tenant found' }

  // Require admin role
  const authError = await requireAdminRole(supabase, user.id, profile.tenant_id)
  if (authError) return authError

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

    // Require admin role
    const authError = await requireAdminRole(supabase, user.id, profile.tenant_id)
    if (authError) return authError

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
    if (!departmentId || !userId) return { error: 'Department ID and User ID are required' }

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

    // Require admin role
    const authError = await requireAdminRole(supabase, user.id, profile.tenant_id)
    if (authError) return authError

    // 2. Upsert the Role (prevent duplicates)
    const { data: existingRole } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', userId)
        .eq('role', 'DepartmentHead')
        .eq('scope_type', 'department')
        .eq('scope_id', departmentId)
        .maybeSingle()

    if (existingRole) {
        // Already assigned
        return { success: true }
    }

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
