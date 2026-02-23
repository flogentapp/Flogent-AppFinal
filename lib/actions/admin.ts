'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSupabaseCall } from '../supabase/logger'
import { getUserPermissions } from './permissions'

// 1. Assign User to Project
export async function assignUserToProject(
  userId: string,
  projectId: string,
  role: 'User' | 'ProjectLeader'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // RBAC: Can only assign if Owner, CEO, Dept Head (of this project's dept), or current leader?
  // User said: "project leader can only manage and edit within their project"
  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO && !permissions.isDepartmentHead && !permissions.isProjectLeader) {
    return { error: 'Permission denied' }
  }

  // If specific leader, check if they lead THIS project
  if (!permissions.isOwner && !permissions.isCEO && !permissions.isDepartmentHead && permissions.isProjectLeader) {
    if (!permissions.managedProjectIds.includes(projectId)) {
      return { error: 'You are not the leader of this project' }
    }
  }

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

// 4. Toggle App Subscription (Tenant Owner Only)
export async function toggleAppSubscription(appName: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if user is tenant owner (only they can manage subscriptions)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('owner_user_id')
    .eq('id', profile.tenant_id)
    .single()

  if (tenant?.owner_user_id !== user.id) {
    return { error: 'Only the Tenant Owner can manage app subscriptions' }
  }

  // Upsert subscription
  const { error } = await supabase
    .from('tenant_app_subscriptions')
    .upsert({
      tenant_id: profile.tenant_id,
      app_name: appName,
      enabled: enabled,
      subscribed_by: user.id
    }, {
      onConflict: 'tenant_id,app_name'
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/apps')
  revalidatePath('/app')
  return { success: true }
}

// 5. Update Project
export async function updateProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const status = formData.get('status') as string
  const requiresApproval = formData.get('requires_timesheet_approval') === 'on'

  if (!id || !name) return { error: 'Missing required fields' }

  // RLS will handle permission checks (Tenant Owner only via Policy 2 in Launch Hardening)
  const { error } = await supabase
    .from('projects')
    .update({
      name,
      code: code || null,
      status,
      requires_timesheet_approval: requiresApproval
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/projects')
  return { success: true }
}

// 6. Create Project
export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const companyId = formData.get('company_id') as string
  const departmentId = formData.get('department_id') as string

  if (!name || !companyId) return { error: "Missing Name" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Auth" }

  // RBAC: Only Owner, CEO or DeptHead can create projects
  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO && !permissions.isDepartmentHead) {
    return { error: 'Unauthorized to create projects' }
  }

  // If Dept Head, check if they are creating in THEIR department
  if (!permissions.isOwner && !permissions.isCEO && permissions.isDepartmentHead) {
    if (!permissions.managedDepartmentIds.includes(departmentId)) {
      return { error: 'Unauthorized: You can only create projects in your own department' }
    }
  }

  // Get tenant
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return { error: "No profile" }

  await supabase.from('projects').insert({
    tenant_id: profile.tenant_id,
    company_id: companyId,
    department_id: departmentId || null,
    name,
    code: code || null,
    status: 'active',
    requires_timesheet_approval: true
  })

  revalidatePath('/admin/projects')
  return { success: true }
}

// 7. Assign Company CEO
export async function assignCompanyCeo(companyId: string, userId: string) {
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

  // 2. Assign the Role (CEO is scoped to Company)
  // We explicitly assign role='CEO' for scope_type='company'
  const { error } = await supabase
    .from('user_role_assignments')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: userId,
      role: 'CEO',
      scope_type: 'company',
      scope_id: companyId,
      created_by: user.id
    })

  if (error) {
    if (error.code === '23505') { // unique_violation
      return { success: true }
    }
    console.error('Error assigning CEO:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/companies')
  return { success: true }
}

// 8. Create Department
export async function createDepartment(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const parentId = formData.get('parent_department_id') as string
  const companyId = formData.get('company_id') as string

  if (!name || !companyId) return { error: "Missing Name or Company" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Auth" }

  // RBAC: Only Owner or CEO can create departments
  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Unauthorized to create departments' }
  }

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) return { error: "No profile" }

  const { error } = await supabase.from('departments').insert({
    tenant_id: profile.tenant_id,
    company_id: companyId,
    name,
    description: description || null,
    parent_department_id: parentId || null
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/departments')
  return { success: true }
}

// 9. Delete Project
export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!projectId) return { error: 'Missing Project ID' }

  // RLS should handle permissions (e.g., only tenant owner/admin)
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/projects')
  return { success: true }
}

// 10. Assign User to Company
export async function assignUserToCompany(userId: string, companyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Permission denied' }
  }

  // Get Tenant
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found' }

  // 1. Get the first project for this company to act as a pivot
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  const projectId = projects?.[0]?.id

  if (!projectId) {
    return { error: 'This company has no projects. Please create at least one project first.' }
  }

  // 2. Assign to Project (This grants company access indirectly)
  const { error: memErr } = await supabase.from('project_memberships').upsert({
    project_id: projectId,
    user_id: userId,
    role: 'User',
    created_by: user.id
  }, { onConflict: 'project_id,user_id' })

  if (memErr) return { error: memErr.message }

  // 3. Update the Profile current_company_id to ensure they switch
  await supabase
    .from('profiles')
    .update({ current_company_id: companyId })
    .eq('id', userId)

  revalidatePath('/admin/users')
  return { success: true }
}

// 15. Global Role Management
export async function assignUserRole(
  userId: string,
  role: 'CEO' | 'DepartmentHead' | 'ProjectLeader' | 'User',
  scopeType: 'company' | 'department',
  scopeId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Permission denied' }
  }

  // Get Tenant
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return { error: 'Profile not found' }

  // Upsert the role
  const { error } = await supabase
    .from('user_role_assignments')
    .upsert({
      user_id: userId,
      tenant_id: profile.tenant_id,
      role,
      scope_type: scopeType,
      scope_id: scopeId,
      created_by: user.id
    }, { onConflict: 'user_id,role,scope_type,scope_id' })

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function removeUserRole(roleAssignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Permission denied' }
  }

  const { error } = await supabase
    .from('user_role_assignments')
    .delete()
    .eq('id', roleAssignmentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

// 14. Create Company
export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  const code = formData.get('code') as string

  if (!name) return { error: 'Name is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) return { error: 'No tenant found' }

  const { data: company, error: insErr } = await supabase.from('companies').insert({
    tenant_id: profile.tenant_id,
    name,
    code: code || null,
    status: 'active',
    created_by: user.id
  }).select().single()

  if (insErr) return { error: insErr.message }

  if (company) {
    // Assign CEO Role (Isolation Fix)
    await supabase.from('user_role_assignments').insert({
      user_id: user.id,
      tenant_id: profile.tenant_id,
      role: 'CEO',
      scope_type: 'company',
      scope_id: company.id,
      created_by: user.id
    })
  }

  revalidatePath('/admin/companies')
  return { success: true }
}

// 12. Update Company
export async function updateCompany(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const status = formData.get('status') as string

  if (!id || !name) return { error: 'Missing required fields' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Unauthorized to update companies' }
  }

  const { error } = await supabase
    .from('companies')
    .update({ name, code: code || null, status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/companies')
  return { success: true }
}

// 13. Update Department
export async function updateDepartment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const companyId = formData.get('company_id') as string

  if (!id || !name) return { error: 'Missing required fields' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Unauthorized to update departments' }
  }

  const { error } = await supabase
    .from('departments')
    .update({ name, description: description || null, company_id: companyId })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/companies')
  return { success: true }
}

// 11. Remove User from Company
export async function removeUserFromCompany(userId: string, companyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return { error: 'Permission denied' }
  }

  // 1. Remove company role assignments
  const { error: roleErr } = await supabase
    .from('user_role_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('scope_id', companyId)
    .eq('scope_type', 'company')

  if (roleErr) return { error: roleErr.message }

  // 2. Remove project memberships in that company
  const { data: projects } = await supabase.from('projects').select('id').eq('company_id', companyId)
  const projectIds = projects?.map(p => p.id) || []

  if (projectIds.length > 0) {
    await supabase.from('project_memberships').delete().eq('user_id', userId).in('project_id', projectIds)
  }

  revalidatePath('/admin/users')
  return { success: true }
}