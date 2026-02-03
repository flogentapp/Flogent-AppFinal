import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NavbarContent } from './NavbarContent'
import { getUserPermissions } from '@/lib/actions/permissions'

export async function AppNavbar() {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch permissions
    const permissions = await getUserPermissions()

    // 1. Try to fetch Profile (Allow failure)
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, first_name, last_name, current_company_id')
        .eq('id', user.id)
        .single()

    // Fallback to metadata if profile is not readable via RLS (Critical fix for lockout)
    const activeTenantId = profile?.tenant_id || user.user_metadata?.tenant_id
    const activeCompanyId = profile?.current_company_id || user.user_metadata?.current_company_id

    // 2. Fetch Companies
    let companies: any[] = []
    if (activeTenantId) {
        // Use adminClient to bypass RLS issues on companies/profiles for discovery
        const { data: tenant } = await adminClient
            .from('tenants')
            .select('owner_user_id')
            .eq('id', activeTenantId)
            .single()

        const isOwner = tenant?.owner_user_id === user.id

        if (isOwner) {
            // Owner sees all companies in tenant
            const { data } = await adminClient
                .from('companies')
                .select('id, name')
                .eq('tenant_id', activeTenantId)
                .eq('status', 'active')
                .order('name')
            companies = data || []
        } else {
            // Non-owners see companies they have a role in, OR a project membership in, OR a department head role in, OR the one in their metadata

            // 1. Company Roles
            const { data: companyRoles } = await adminClient
                .from('user_role_assignments')
                .select('scope_id')
                .eq('user_id', user.id)
                .eq('scope_type', 'company')

            // 2. Project Memberships
            const { data: projectMemberships } = await adminClient
                .from('project_memberships')
                .select('projects(company_id)')
                .eq('user_id', user.id)

            // 3. Department Roles (Fetch the company for each department)
            const { data: deptRoles } = await adminClient
                .from('user_role_assignments')
                .select('scope_id')
                .eq('user_id', user.id)
                .eq('scope_type', 'department')

            let allowedIds = new Set<string>(companyRoles?.map(a => a.scope_id).filter(Boolean) as string[] || [])

            projectMemberships?.forEach((pm: any) => {
                const cid = pm.projects?.company_id
                if (cid) allowedIds.add(cid)
            })

            if (deptRoles && deptRoles.length > 0) {
                const deptIds = deptRoles.map(r => r.scope_id).filter(Boolean)
                const { data: depts } = await adminClient
                    .from('departments')
                    .select('company_id')
                    .in('id', deptIds)
                depts?.forEach(d => {
                    if (d.company_id) allowedIds.add(d.company_id)
                })
            }

            // Fallback: Also include the company from their profile (for invited users)
            if (activeCompanyId) {
                allowedIds.add(activeCompanyId)
            }

            if (allowedIds.size > 0) {
                const { data } = await adminClient
                    .from('companies')
                    .select('id, name')
                    .in('id', Array.from(allowedIds))
                    .eq('status', 'active')
                    .order('name')
                companies = data || []
            }
        }
    }

    // 3. Fallback defaults (Ensures Navbar ALWAYS renders)
    // If no company is selected, default to the first one, or a placeholder
    const currentCompany = companies.find(c => c.id === activeCompanyId)
        || companies[0]
        || { id: '00000000-0000-0000-0000-000000000000', name: 'Select Company' }

    // 4. Fetch Enabled Apps (for navigation/hiding)
    let enabledApps: string[] = []
    if (activeTenantId) {
        const { data: subs } = await adminClient
            .from('tenant_app_subscriptions')
            .select('app_name')
            .eq('tenant_id', activeTenantId)
            .eq('enabled', true)

        if (subs) {
            enabledApps = subs.map(s => s.app_name)
        }
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : (user.user_metadata.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : (user.email || 'User'))
    const userEmail = user.email || ''

    return (
        <NavbarContent
            userEmail={userEmail}
            userName={userName}
            currentCompany={currentCompany}
            availableCompanies={companies}
            enabledApps={enabledApps}
            permissions={permissions}
        />
    )
}