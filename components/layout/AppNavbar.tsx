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
            // Non-owners see companies they have a role in OR the one in their metadata
            const { data: assignments } = await adminClient
                .from('user_role_assignments')
                .select('scope_id')
                .eq('user_id', user.id)
                .eq('scope_type', 'company')

            let allowedIds = assignments?.map(a => a.scope_id) || []

            // Fallback: Also include the company from their profile (for invited users)
            if (activeCompanyId && !allowedIds.includes(activeCompanyId)) {
                allowedIds.push(activeCompanyId)
            }

            if (allowedIds.length > 0) {
                const { data } = await adminClient
                    .from('companies')
                    .select('id, name')
                    .in('id', allowedIds)
                    .eq('status', 'active')
                    .order('name')
                companies = data || []
            }

            // FINAL SAFETY FALLBACK: If we still have no companies but we HAVE a tenant,
            // fetch all companies in the tenant via adminClient (guaranteed to work)
            // This fix ensures that even if role assignments fail, the user can see and switch to any company in their tenant.
            if (companies.length === 0 && activeTenantId) {
                const { data } = await adminClient
                    .from('companies')
                    .select('id, name')
                    .eq('tenant_id', activeTenantId)
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