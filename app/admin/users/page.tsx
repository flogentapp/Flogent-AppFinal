import { createClient } from '@/lib/supabase/server'
import { UsersClient } from '@/components/admin/UsersClient'
import { getUserPermissions } from '@/lib/actions/permissions'

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

  // 2. Fetch users
  const currentCompanyId = user.user_metadata.current_company_id || companies?.[0]?.id || null

  let users: any[] = []
  if (isOwner) {
    // Owner sees ALL users in the tenant
    const { data } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, status')
      .eq('tenant_id', profile.tenant_id)
      .order('first_name')
    users = data || []
  } else if (currentCompanyId) {
    // Non-owners only see users in the current company context
    const { data: assignments } = await supabase
      .from('user_role_assignments')
      .select('user_id')
      .eq('scope_id', currentCompanyId)
      .eq('scope_type', 'company')
    const userIds = assignments?.map(a => a.user_id) || []
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, status')
        .in('id', userIds)
        .order('first_name')
      users = data || []
    }
  }

  // Load projects for current company
  let projects: any[] = []
  if (currentCompanyId) {
    const { data: p, error: pErr } = await supabase
      .from('projects')
      .select('id, name, code, status, company_id')
      .eq('company_id', currentCompanyId)
      .order('name')

    if (!pErr) projects = p || []
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

  return (
    <UsersClient
      users={users || []}
      projects={projects || []}
      memberships={memberships || []}
      currentCompanyId={currentCompanyId}
    />
  )
}
