'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSupabaseCall } from '../supabase/logger'

export async function createTimeEntry(formData: FormData) {
    const projectId = formData.get('project_id') as string
    const date = formData.get('date') as string
    const hours = parseInt(formData.get('hours') as string)
    const minutes = parseInt(formData.get('minutes') as string) || 0
    const description = formData.get('description') as string
    const isAdditionalWork = formData.get('is_additional_work') === 'true'
    const additionalWorkDescription = formData.get('additional_work_description') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { error: 'Profile not found' }
    }

    const { error } = await supabase.from('time_entries').insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        project_id: projectId,
        entry_date: date,
        hours,
        minutes,
        description,
        is_additional_work: isAdditionalWork,
        additional_work_description: isAdditionalWork ? additionalWorkDescription : null,
        status: 'draft',
        created_by: user.id
    })

    await logSupabaseCall('createTimeEntry', supabase, { projectId, date, hours }, error)

    if (error) {
        return { error: error.message }
    }

    // CRITICAL FIX: Refresh the entire layout to ensure UI updates instantly
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function updateTimeEntry(entryId: string, formData: FormData) {
    const hours = parseInt(formData.get('hours') as string)
    const minutes = parseInt(formData.get('minutes') as string) || 0
    const description = formData.get('description') as string
    const isAdditionalWork = formData.get('is_additional_work') === 'true'
    const additionalWorkDescription = formData.get('additional_work_description') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('time_entries')
        .update({
            hours,
            minutes,
            description,
            is_additional_work: isAdditionalWork,
            additional_work_description: isAdditionalWork ? additionalWorkDescription : null,
            updated_by: user.id
        })
        .eq('id', entryId)

    await logSupabaseCall('updateTimeEntry', supabase, { entryId, hours, minutes }, error)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function deleteTimeEntry(entryId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId)

    await logSupabaseCall('deleteTimeEntry', supabase, { entryId }, error)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function submitTimeEntry(entryId: string) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('submit_time_entry', {
        p_entry_id: entryId
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function approveTimeEntry(entryId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase.rpc('approve_time_entry', {
        p_entry_id: entryId,
        p_approved_by: user.id
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function rejectTimeEntry(entryId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase.rpc('reject_time_entry', {
        p_entry_id: entryId,
        p_rejected_by: user.id,
        p_rejection_reason: reason
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}