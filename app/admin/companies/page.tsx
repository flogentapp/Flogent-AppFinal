import { createClient } from '@/lib/supabase/server'
import { CompaniesClient } from '@/components/admin/CompaniesClient'
import { revalidatePath } from 'next/cache'
import { getUserPermissions } from '@/lib/actions/permissions'

// SERVER ACTION (Copied/Moved here to keep inline if preferred, or imported)
async function createCompany(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const code = formData.get('code') as string

    if (!name) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return

    const { data: company } = await supabase.from('companies').insert({
        tenant_id: profile.tenant_id,
        name,
        code: code || null,
        status: 'active',
        created_by: user.id
    }).select().single()

    if (company) {
        // Assign CEO Role (Isolation Fix)
        await supabase.from('user_role_assignments').insert({
            user_id: user.id,
            tenant_id: profile.tenant_id,
            role: 'CEO',
            scope_type: 'company',
            scope_id: company.id,
            created_by: user.id
        })
    }

    revalidatePath('/admin/companies')
}

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
    if (tenantId) {
        let companyQuery = supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId)

        if (!permissions.isOwner && !permissions.isCEO) {
            // Non-CEOs/Owners only see companies where they have a dept or project
            // For now, let's allow them to see the company list if they have any role in it
            const { data: assignments } = await supabase
                .from('user_role_assignments')
                .select('scope_id')
                .eq('user_id', user.id)
                .eq('scope_type', 'company')

            const ids = assignments?.map(a => a.scope_id) || []
            if (ids.length > 0) {
                companyQuery = companyQuery.in('id', ids)
            } else {
                // Check if they are a Dept head in any company
                const { data: deptAssignments } = await supabase
                    .from('user_role_assignments')
                    .select('scope_id')
                    .eq('user_id', user.id)
                    .eq('scope_type', 'department')

                const deptIds = deptAssignments?.map(a => a.scope_id) || []
                if (deptIds.length > 0) {
                    const { data: deptCompanies } = await supabase.from('departments').select('company_id').in('id', deptIds)
                    const companyIds = Array.from(new Set(deptCompanies?.map(d => d.company_id) || []))
                    companyQuery = companyQuery.in('id', companyIds)
                } else {
                    return <div className="p-8 text-center text-gray-500">Access Denied: You do not have any management roles assigned.</div>
                }
            }
        }

        const { data } = await companyQuery.order('name')
        companies = data || []
    }

    // 2. Fetch Users (for the dropdown)
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
            users={users}
            createAction={createCompany}
        />
    )
}
