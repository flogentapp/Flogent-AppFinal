import { createClient } from '@/lib/supabase/server'
import { CompaniesClient } from '@/components/admin/CompaniesClient'
import { revalidatePath } from 'next/cache'

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

    await supabase.from('companies').insert({
        tenant_id: profile.tenant_id,
        name,
        code: code || null,
        status: 'active'
    })

    revalidatePath('/admin/companies')
}

export default async function CompaniesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    // 1. Fetch Companies
    let companies: any[] = []
    if (tenantId) {
        const { data } = await supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name')
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
