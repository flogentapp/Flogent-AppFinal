'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function switchCompany(companyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')
    
    // 1. Update the Profile (This is what the App reads)
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