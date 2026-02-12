import { createClient } from '@/lib/supabase/server'
import { UsersClient } from '@/components/admin/UsersClient'
import { getUserPermissions } from '@/lib/actions/permissions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const permissions = await getUserPermissions()
  if (!permissions.isOwner && !permissions.isCEO) {
    return <div className="p-8 text-center text-gray-500">Access Denied: You do not have permissions to manage users and roles.</div>
  }

  // Get tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return <div>No tenant found.</div>

  const isOwner = permissions.isOwner

  // 1. Fetch accessible companies
  let companies: any[] = []
  if (isOwner) {
    const { data } = await supabase
      .from('companies')
      .select('id, name, code')
      .eq('tenant_id', profile.tenant_id)
      .order('name')
    companies = data || []
  } else {
    const { data: assignments } = await supabase
      .from('user_role_assignments')
      .select('scope_id')
      .eq('user_id', user.id)
      .eq('scope_type', 'company')
    const ids = assignments?.map(a => a.scope_id) || []
    if (ids.length > 0) {
      const { data } = await supabase
        .from('companies')
        .select('id, name, code')
        .in('id', ids)
        .order('name')
      companies = data || []
    }
  }

  // 2. Load projects for current company
  const currentCompanyId = user.user_metadata.current_company_id || companies?.[0]?.id || null
  let projects: any[] = []
  if (currentCompanyId) {
    const { data: p, error: pErr } = await supabase
      .from('projects')
      .select('id, name, code, status, company_id')
      .eq('company_id', currentCompanyId)
      .order('name')

    if (!pErr) projects = p || []
  }

  // 3. Fetch users in the current company context
  let users: any[] = []
  if (currentCompanyId) {
    // A user is in a company if they:
    // 1. Have a direct role (CEO)
    // 2. Are a member of ANY project in that company
    // 3. Have their current_company_id set to this company (newly invited)

    const [{ data: roleAss }, { data: projMems }] = await Promise.all([
      supabase.from('user_role_assignments').select('user_id').eq('scope_id', currentCompanyId).eq('scope_type', 'company'),
      supabase.from('project_memberships').select('user_id').in('project_id', projects?.map(p => p.id) || [])
    ])

    const userIds = new Set<string>()
    roleAss?.forEach(a => userIds.add(a.user_id))
    projMems?.forEach(m => userIds.add(m.user_id))

    // Also include anyone who has this as their current_company_id (newly invited)
    const { data: profileUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('current_company_id', currentCompanyId)

    profileUsers?.forEach(p => userIds.add(p.id))

    if (userIds.size > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, status')
        .in('id', Array.from(userIds))
        .order('first_name')
      users = data || []
    }
  }

  // Load memberships for those projects
  const projectIds = projects.map(p => p.id)
  let memberships: any[] = []

  if (projectIds.length > 0) {
    const { data: m, error: mErr } = await supabase
      .from('project_memberships')
      .select(`
        id,
        role,
        project_id,
        user_id,
        projects (id, name, code),
        profiles (id, first_name, last_name, email)
      `)
      .in('project_id', projectIds)

    if (!mErr) memberships = m || []
  }

  // 4. Fetch ALL users in tenant (to allow adding existing users to this company)
  const { data: allTenantUsers } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('tenant_id', profile.tenant_id)
    .order('first_name')

  return (
    <UsersClient
      users={users || []}
      projects={projects || []}
      memberships={memberships || []}
      currentCompanyId={currentCompanyId}
      companies={companies}
      allTenantUsers={allTenantUsers || []}
    />
  )
}

