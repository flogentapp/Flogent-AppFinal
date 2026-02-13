'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function switchCompany(companyId: string) {
    if (!companyId) throw new Error('Company ID is required')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Verify the company exists and belongs to the user's tenant
    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) throw new Error('No tenant context')

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('id', companyId)
        .eq('tenant_id', tenantId)
        .single()

    if (!company) throw new Error('Company not found or access denied')

    // 1. Update the Profile (This is what the App reads)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_company_id: companyId })
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error(profileError.message)
    }

    // 2. Update Auth Metadata (Good for sync)
    await supabase.auth.updateUser({
        data: { current_company_id: companyId }
    })

    // 3. Force Global Refresh
    revalidatePath('/', 'layout')
}
