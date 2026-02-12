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

    if (activeTenantId) {
        const [
            { data: companiesData },
            { data: deptsData },
            { data: projectsData }
        ] = await Promise.all([
            adminClient.from('companies').select('id, name, tenant_id').eq('tenant_id', activeTenantId).order('name'),
            adminClient.from('departments').select('id, name, company_id').eq('tenant_id', activeTenantId).order('name'),
            adminClient.from('projects').select('id, name, department_id, company_id').eq('tenant_id', activeTenantId).order('name')
        ])

        companies = companiesData || []
        departments = deptsData || []
        projects = projectsData || []
    }

    const currentCompany = companies.find(c => c.id === activeCompanyId)
        || companies[0]
        || { id: '00000000-0000-0000-0000-000000000000', name: 'Select Company' }

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
