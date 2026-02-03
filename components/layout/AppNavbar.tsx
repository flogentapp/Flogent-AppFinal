import { createClient } from '@/lib/supabase/server'
import { NavbarContent } from './NavbarContent'
import { getUserPermissions } from '@/lib/actions/permissions'

export async function AppNavbar() {
    const supabase = await createClient()
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

    // 2. Fetch Companies
    let companies: any[] = []
    if (profile?.tenant_id) {
        // Check if user is Tenant Owner
        const { data: tenant } = await supabase
            .from('tenants')
            .select('owner_user_id')
            .eq('id', profile.tenant_id)
            .single()

        const isOwner = tenant?.owner_user_id === user.id

        if (isOwner) {
            // Owner sees all companies in tenant
            const { data } = await supabase
                .from('companies')
                .select('id, name')
                .eq('tenant_id', profile.tenant_id)
                .eq('status', 'active')
                .order('name')
            companies = data || []
        } else {
            // Non-owners only see companies they have a role in
            const { data: assignments } = await supabase
                .from('user_role_assignments')
                .select('scope_id')
                .eq('user_id', user.id)
                .eq('scope_type', 'company')

            let allowedIds = assignments?.map(a => a.scope_id) || []

            // Fallback: Also include the company from their profile (for invited users)
            if (profile.current_company_id && !allowedIds.includes(profile.current_company_id)) {
                allowedIds.push(profile.current_company_id)
            }

            if (allowedIds.length > 0) {
                const { data } = await supabase
                    .from('companies')
                    .select('id, name')
                    .in('id', allowedIds)
                    .eq('status', 'active')
                    .order('name')
                companies = data || []
            }
        }
    }

    // 3. Fallback defaults (Ensures Navbar ALWAYS renders)
    // If no company is selected, default to the first one, or a placeholder
    const currentCompany = companies.find(c => c.id === profile?.current_company_id)
        || companies[0]
        || { id: '00000000-0000-0000-0000-000000000000', name: 'Select Company' }

    // 4. Fetch Enabled Apps (for navigation/hiding)
    let enabledApps: string[] = []
    if (profile?.tenant_id) {
        const { data: subs } = await supabase
            .from('tenant_app_subscriptions')
            .select('app_name')
            .eq('tenant_id', profile.tenant_id)
            .eq('enabled', true)

        if (subs) {
            enabledApps = subs.map(s => s.app_name)
        }
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : (user.email || 'User')
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