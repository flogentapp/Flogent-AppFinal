'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function switchCompany(companyId: string) {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // 1. Verify Access (Bypass RLS for verification)
    const { data: profile } = await adminClient.from('profiles').select('tenant_id').eq('id', user.id).single()
    const { data: tenant } = await adminClient.from('tenants').select('owner_user_id').eq('id', profile?.tenant_id).single()
    const isOwner = tenant?.owner_user_id === user.id

    if (!isOwner) {
        // Verify they have a role OR are joining the first time
        const { data: assignment } = await adminClient
            .from('user_role_assignments')
            .select('id')
            .eq('user_id', user.id)
            .eq('scope_type', 'company')
            .eq('scope_id', companyId)
            .maybeSingle()

        if (!assignment) {
            // Check if this company belongs to their tenant as a last resort fallback
            const { data: company } = await adminClient
                .from('companies')
                .select('id')
                .eq('id', companyId)
                .eq('tenant_id', profile?.tenant_id)
                .single()

            if (!company) {
                throw new Error('Access Denied: You are not assigned to this company.')
            }
        }
    }

    // 2. Update the Profile via adminClient (Bypass RLS recursion)
    const { error: profileError } = await adminClient
        .from('profiles')
        .update({ current_company_id: companyId })
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error(profileError.message)
    }

    // 3. Update Auth Metadata (For sync)
    await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { current_company_id: companyId }
    })

    // 4. Force Global Refresh
    revalidatePath('/', 'layout')
}