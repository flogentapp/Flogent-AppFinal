
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDiaryTemplates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const { data, error } = await supabase
        .from('diary_templates')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching diary templates:', error)
        return []
    }

    return data
}

export async function createDiaryTemplate(formData: FormData) {
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const fieldsRaw = formData.get('fields') as string
    const fields = JSON.parse(fieldsRaw)

    const { data, error } = await admin
        .from('diary_templates')
        .insert({
            tenant_id: profile.tenant_id,
            company_id: profile.current_company_id,
            title,
            description,
            fields,
            created_by: user.id
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { data }
}

export async function getDailyDiaryEntry(date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('diary_entries')
        .select('*, template:diary_templates(*)')
        .eq('user_id', user.id)
        .eq('entry_date', date)
        .maybeSingle()

    if (error) {
        console.error('Error fetching diary entry:', error)
        return null
    }

    return data
}

export async function submitDiaryEntry(templateId: string, date: string, responses: any) {
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profile not found' }

    const { error } = await admin
        .from('diary_entries')
        .upsert({
            tenant_id: profile.tenant_id,
            company_id: profile.current_company_id,
            user_id: user.id,
            template_id: templateId,
            entry_date: date,
            responses,
            status: 'Submitted',
            updated_at: new Date().toISOString()
        })

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { success: true }
}

export async function getDiaryComplianceOverview(date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    // Fetch all users in tenant and their entries for this date
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, current_company_id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')

    const { data: entries, error: eErr } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('entry_date', date)

    if (pErr || eErr) return []

    return profiles.map(p => ({
        ...p,
        entry: entries.find(e => e.user_id === p.id)
    }))
}
