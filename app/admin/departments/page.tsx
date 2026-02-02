import { createClient } from '@/lib/supabase/server'
import { DepartmentsClient } from '@/components/admin/DepartmentsClient'

export default async function DepartmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Access Denied</div>

    // 1. Fetch Departments (Same as before)
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name')

    // 2. Fetch Users (Same as before)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('status', 'active')
        .order('first_name')

    // 3. Fetch Companies (New: Needed for Create Department)
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .eq('tenant_id', user.user_metadata.tenant_id || (await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()).data?.tenant_id)
        .order('name')

    return (
        <DepartmentsClient
            departments={departments || []}
            users={users || []}
            companies={companies || []}
        />
    )
}