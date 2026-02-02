import { createClient } from '@/lib/supabase/server'
import { DepartmentsClient } from '@/components/admin/DepartmentsClient'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function DepartmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    const permissions = await getUserPermissions()
    if (!permissions.isOwner && !permissions.isCEO && !permissions.isDepartmentHead) {
        return <div className="p-8 text-center text-gray-500">Access Denied: You do not have department management permissions.</div>
    }

    // 0. Get Profile & Tenant Info
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id
    const isOwner = permissions.isOwner

    // 1. Fetch Companies (Filtered)
    let companies: any[] = []
    if (isOwner || permissions.isCEO) {
        const { data } = await supabase.from('companies').select('id, name').eq('tenant_id', tenantId).order('name')
        companies = data || []
    } else {
        const { data: assignments } = await supabase.from('user_role_assignments').select('scope_id').eq('user_id', user.id).eq('scope_type', 'company')
        const ids = assignments?.map(a => a.scope_id) || []
        if (ids.length > 0) {
            const { data } = await supabase.from('companies').select('id, name').in('id', ids).order('name')
            companies = data || []
        }
    }

    // 2. Fetch Departments (Filtered by Role)
    let deptQuery = supabase
        .from('departments')
        .select('*')
        .order('name')

    if (isOwner || permissions.isCEO) {
        deptQuery = deptQuery.in('company_id', companies.map(c => c.id))
    } else {
        // Must be a Dept Head if they reached here and aren't Owner/CEO
        deptQuery = deptQuery.in('id', permissions.managedDepartmentIds)
    }

    const { data: departments } = await deptQuery

    // 3. Fetch Users
    let users: any[] = []
    if (isOwner) {
        // Owner sees all active users in tenant
        const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('first_name')
        users = data || []
    } else if (companies.length > 0) {
        // Non-owners see users in their accessible companies
        const { data: assignments } = await supabase
            .from('user_role_assignments')
            .select('user_id')
            .in('scope_id', companies.map(c => c.id))
            .eq('scope_type', 'company')
        const userIds = assignments?.map(a => a.user_id) || []
        if (userIds.length > 0) {
            const { data } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .in('id', userIds)
                .eq('status', 'active')
                .order('first_name')
            users = data || []
        }
    }

    return (
        <DepartmentsClient
            departments={departments || []}
            users={users || []}
            companies={companies || []}
        />
    )
}