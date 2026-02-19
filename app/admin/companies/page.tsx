import { createClient } from '@/lib/supabase/server'
import { CompaniesClient } from '@/components/admin/CompaniesClient'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function CompaniesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    const permissions = await getUserPermissions()
    if (!permissions.canManageAny) {
        return <div className="p-8 text-center text-gray-500">Access Denied: You do not have management permissions.</div>
    }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    // 1. Fetch Companies (Filtered)
    let companies: any[] = []
    let departments: any[] = []
    let projects: any[] = []

    if (tenantId) {
        // Fetch data via regular supabase client (RLS active)
        const [
            { data: companiesData },
            { data: deptsData },
            { data: projectsData }
        ] = await Promise.all([
            supabase.from('companies').select('*').order('name'),
            supabase.from('departments').select('*').order('name'),
            supabase.from('projects').select('*').order('name')
        ])

        // RLS already filters these to what the user "CAN SEE" per role.
        // But for management, we might want to filter even further to what they "CAN MANAGE".
        companies = companiesData || []
        departments = deptsData || []
        projects = projectsData || []

        if (!permissions.isOwner && !permissions.isCEO && !permissions.isAdmin) {
            // If they are only a Dept Head or Project Leader, they should only see their own scope
            const managedCompIds = permissions.managedCompanyIds
            const managedDeptIds = permissions.managedDepartmentIds
            const managedProjIds = permissions.managedProjectIds

            companies = companies.filter(c => managedCompIds.includes(c.id))
            departments = departments.filter(d => managedDeptIds.includes(d.id) || managedCompIds.includes(d.company_id))
            projects = projects.filter(p => managedProjIds.includes(p.id) || managedCompIds.includes(p.company_id))
        }
    }

    // 2. Fetch Users (for assignment dropdowns)
    let users: any[] = []
    if (tenantId) {
        const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('tenant_id', tenantId)
            .order('first_name')
        users = data || []
    }

    return (
        <CompaniesClient
            companies={companies}
            departments={departments}
            projects={projects}
            users={users}
        />
    )
}
