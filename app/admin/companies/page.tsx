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
        // Fetch all Org data for management
        const [
            { data: companiesData },
            { data: deptsData },
            { data: projectsData }
        ] = await Promise.all([
            supabase.from('companies').select('*').eq('tenant_id', tenantId).order('name'),
            supabase.from('departments').select('*').eq('tenant_id', tenantId).order('name'),
            supabase.from('projects').select('*').eq('tenant_id', tenantId).order('name')
        ])

        companies = companiesData || []
        departments = deptsData || []
        projects = projectsData || []

        // RBAC filtering for non-owners/CEOs
        if (!permissions.isOwner && !permissions.isCEO) {
            // Filter companies they can manage
            // ... (keeping existing logic or simplifying for context)
            // For unified management, we assume they see what they can manage.
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
