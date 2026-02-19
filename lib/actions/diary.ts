
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
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const admin = createAdminClient()
    let query = admin
        .from('diary_templates')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)

    if (profile.current_company_id) {
        query = query.eq('company_id', profile.current_company_id)
    }

    const { data, error } = await query

    if (error) {
        if (error.code === 'PGRST205') {
            console.warn('Diary templates table missing. Please run migrations.')
            return []
        }
        console.error('Error fetching diary templates:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
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
            accent_color: formData.get('accentColor') as string || 'indigo',
            created_by: user.id
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { data }
}

export async function updateDiaryTemplate(id: string, formData: FormData) {
    const admin = createAdminClient()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const fieldsRaw = formData.get('fields') as string
    const fields = JSON.parse(fieldsRaw)

    const { error } = await admin
        .from('diary_templates')
        .update({
            title,
            description,
            fields,
            accent_color: formData.get('accentColor') as string || 'indigo',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { success: true }
}

export async function toggleTemplateStatus(id: string, isActive: boolean) {
    const admin = createAdminClient()
    const { error } = await admin
        .from('diary_templates')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { success: true }
}

export async function deleteDiaryTemplate(id: string) {
    const admin = createAdminClient()
    const { error } = await admin
        .from('diary_templates')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/diary')
    return { success: true }
}

export async function getDailyDiaryEntries(date: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.warn('getDailyDiaryEntries: No user found')
            return []
        }

        const admin = createAdminClient()
        const { data, error } = await admin
            .from('diary_entries')
            .select(`
                *,
                template:diary_templates(*)
            `)
            .eq('user_id', user.id)
            .eq('entry_date', date)
            .order('created_at', { ascending: false })

        if (error) {
            if (error.code === 'PGRST205') {
                console.warn('Diary tables missing from database.')
                return []
            }
            console.error('Error fetching diary entries:', error.message)
            return []
        }

        return data || []
    } catch (err: any) {
        console.error('Fatal error in getDailyDiaryEntries:', err?.message || err)
        return []
    }
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
        }, {
            onConflict: 'user_id, entry_date, template_id'
        })

    if (error) {
        if (error.code === 'PGRST205') {
            return { error: 'Database table missing. Please ensure migrations have been run.' }
        }
        return { error: error.message }
    }

    revalidatePath('/diary')
    return { success: true }
}

export async function getDiaryComplianceOverview(date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const admin = createAdminClient()

    // Fetch profiles in SAME company
    let profilesQuery = admin
        .from('profiles')
        .select('id, first_name, last_name, current_company_id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')

    if (profile.current_company_id) {
        profilesQuery = profilesQuery.eq('current_company_id', profile.current_company_id)
    }

    const { data: profiles, error: pErr } = await profilesQuery

    // Fetch entries in SAME company
    let entriesQuery = admin
        .from('diary_entries')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('entry_date', date)

    if (profile.current_company_id) {
        entriesQuery = entriesQuery.eq('company_id', profile.current_company_id)
    }

    const { data: entries, error: eErr } = await entriesQuery

    if (pErr || eErr) {
        if (eErr?.code === 'PGRST205') {
            console.warn('Diary entries table missing during compliance fetch. Please run migrations.')
            return []
        }
        console.error('Compliance fetch error:', {
            profiles: pErr ? { message: pErr.message, code: pErr.code } : null,
            entries: eErr ? { message: eErr.message, code: eErr.code } : null
        })
        return []
    }

    return profiles.map(p => ({
        ...p,
        entry: entries.find(e => e.user_id === p.id)
    }))
}
