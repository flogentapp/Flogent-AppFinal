import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPermissions } from '@/lib/actions/permissions'
import { ShellContent } from './ShellContent'

export async function AppShell({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <>{children}</>

    const permissions = await getUserPermissions()

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, first_name, last_name, current_company_id, current_department_id, current_project_id')
        .eq('id', user.id)
        .single()

    const activeTenantId = profile?.tenant_id || user.user_metadata?.tenant_id
    const activeCompanyId = profile?.current_company_id || user.user_metadata?.current_company_id
    const activeDeptId = profile?.current_department_id || user.user_metadata?.current_department_id
    const activeProjId = profile?.current_project_id || user.user_metadata?.current_project_id

    let companies: any[] = []
    let departments: any[] = []
    let projects: any[] = []
    let activeSelectedCompany: any = null

    if (activeTenantId) {
        // Use regular supabase client to ENFORCE RLS
        const [
            { data: companiesData },
            { data: deptsData },
            { data: projectsData }
        ] = await Promise.all([
            supabase.from('companies').select('id, name, tenant_id').order('name'),
            supabase.from('departments').select('id, name, company_id').order('name'),
            supabase.from('projects').select('id, name, department_id, company_id').order('name')
        ])

        const allCompanies = companiesData || []
        const allDepts = deptsData || []
        const allProjs = projectsData || []

        // With new RLS, allCompanies only contains companies the user is ALLOWED to see.
        companies = allCompanies

        // 2. Resolve Active Company Context
        // Priority: Profile -> Metadata -> First Available Company
        const currentCompId = profile?.current_company_id || user.user_metadata?.current_company_id || (companies.length > 0 ? companies[0].id : null)

        // 3. Filter Departments & Projects strictly by Active Company context
        // Even if RLS allows seeing more, the UI should only show the active context
        departments = allDepts.filter(d => d.company_id === currentCompId)
        projects = allProjs.filter(p => p.company_id === currentCompId)

        // 4. Set final context for UI
        activeSelectedCompany = companies.find(c => c.id === currentCompId) || companies[0]
    }

    const currentCompany = activeSelectedCompany || { id: '00000000-0000-0000-0000-000000000000', name: 'Select Company' }

    let enabledApps: string[] = []
    if (activeTenantId) {
        const { data: subs } = await adminClient
            .from('tenant_app_subscriptions')
            .select('app_name')
            .eq('tenant_id', activeTenantId)
            .eq('enabled', true)
        if (subs) enabledApps = subs.map(s => s.app_name)
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : (user.user_metadata.first_name || user.email)
    const userEmail = user.email || ''

    return (
        <ShellContent
            userEmail={userEmail}
            userName={userName}
            currentCompany={currentCompany}
            availableCompanies={companies}
            enabledApps={enabledApps}
            permissions={permissions}
            departments={departments}
            projects={projects}
            currentDepartmentId={activeDeptId}
            currentProjectId={activeProjId}
        >
            {children}
        </ShellContent>
    )
}
