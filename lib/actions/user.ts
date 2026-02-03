'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function switchCompany(companyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // 1. Verify Access (Isolation Fix)
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const { data: tenant } = await supabase.from('tenants').select('owner_user_id').eq('id', profile?.tenant_id).single()
    const isOwner = tenant?.owner_user_id === user.id

    if (!isOwner) {
        const { data: assignment } = await supabase
            .from('user_role_assignments')
            .select('id')
            .eq('user_id', user.id)
            .eq('scope_type', 'company')
            .eq('scope_id', companyId)
            .maybeSingle()

        if (!assignment) {
            throw new Error('Access Denied: You are not assigned to this company.')
        }
    }

    // 2. Update the Profile (This is what the App reads)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_company_id: companyId })
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error(profileError.message)
    }

    // 2. Update Auth Metadata (Good for sync, but optional)
    await supabase.auth.updateUser({
        data: { current_company_id: companyId }
    })

    // 3. Force Global Refresh
    revalidatePath('/', 'layout')
}