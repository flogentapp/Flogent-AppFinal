import { createClient } from '@/lib/supabase/server'
import { UsersClient } from '@/components/admin/UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get tenant_id (do NOT select current_company_id here)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-600">Failed to load profile tenant_id: {profileError?.message || 'No tenant_id found'}</div>
      </div>
    )
  }

  // Parallel fetch: Companies & Users (No waterfall)
  const [
    { data: companies, error: companiesError },
    { data: users, error: usersError }
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, code')
      .eq('tenant_id', profile.tenant_id)
      .order('name'),
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, status')
      .eq('tenant_id', profile.tenant_id)
      .order('first_name')
  ])

  if (companiesError) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-600">Failed to load companies: {companiesError.message}</div>
      </div>
    )
  }

  if (usersError) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-600">Failed to load users: {usersError.message}</div>
      </div>
    )
  }

  const currentCompanyId = companies?.[0]?.id || null

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
    />
  )
}
