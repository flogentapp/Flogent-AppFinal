'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSupabaseCall } from '../supabase/logger'

export async function createTimeEntry(formData: FormData) {
    const projectId = formData.get('project_id') as string
    const date = formData.get('date') as string
    const rawHours = formData.get('hours') as string
    const rawMinutes = formData.get('minutes') as string
    const description = formData.get('description') as string
    const isAdditionalWork = formData.get('is_additional_work') === 'true'
    const additionalWorkDescription = formData.get('additional_work_description') as string

    // Input validation
    if (!projectId) return { error: 'Project is required' }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Valid date is required (YYYY-MM-DD)' }

    const hours = parseInt(rawHours)
    const minutes = parseInt(rawMinutes) || 0
    if (isNaN(hours) || hours < 0) return { error: 'Hours must be a non-negative number' }
    if (minutes < 0 || minutes > 59) return { error: 'Minutes must be between 0 and 59' }
    if (hours === 0 && minutes === 0) return { error: 'Time entry must have at least some time' }

    if (isAdditionalWork && !additionalWorkDescription?.trim()) {
        return { error: 'Additional work description is required when marking as additional work' }
    }

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

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function updateTimeEntry(entryId: string, formData: FormData) {
    if (!entryId) return { error: 'Entry ID is required' }

    const rawHours = formData.get('hours') as string
    const rawMinutes = formData.get('minutes') as string
    const description = formData.get('description') as string
    const isAdditionalWork = formData.get('is_additional_work') === 'true'
    const additionalWorkDescription = formData.get('additional_work_description') as string

    const hours = parseInt(rawHours)
    const minutes = parseInt(rawMinutes) || 0
    if (isNaN(hours) || hours < 0) return { error: 'Hours must be a non-negative number' }
    if (minutes < 0 || minutes > 59) return { error: 'Minutes must be between 0 and 59' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership: user can only update their own draft entries
    const { data: entry } = await supabase
        .from('time_entries')
        .select('user_id, status')
        .eq('id', entryId)
        .single()

    if (!entry) return { error: 'Time entry not found' }
    if (entry.user_id !== user.id) return { error: 'You can only edit your own time entries' }
    if (entry.status !== 'draft') return { error: 'Only draft entries can be edited' }

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
    if (!entryId) return { error: 'Entry ID is required' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership: user can only delete their own draft entries
    const { data: entry } = await supabase
        .from('time_entries')
        .select('user_id, status')
        .eq('id', entryId)
        .single()

    if (!entry) return { error: 'Time entry not found' }
    if (entry.user_id !== user.id) return { error: 'You can only delete your own time entries' }
    if (entry.status !== 'draft') return { error: 'Only draft entries can be deleted' }

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
    if (!entryId) return { error: 'Entry ID is required' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: entry } = await supabase
        .from('time_entries')
        .select('user_id, status')
        .eq('id', entryId)
        .single()

    if (!entry) return { error: 'Time entry not found' }
    if (entry.user_id !== user.id) return { error: 'You can only submit your own time entries' }
    if (entry.status !== 'draft') return { error: 'Only draft entries can be submitted' }

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
    if (!entryId) return { error: 'Entry ID is required' }

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
    if (!entryId) return { error: 'Entry ID is required' }
    if (!reason?.trim()) return { error: 'Rejection reason is required' }

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

// Void-returning wrappers for use as form actions in client components
export async function approveTimeEntryAction(entryId: string): Promise<void> {
    await approveTimeEntry(entryId)
}

export async function rejectTimeEntryAction(entryId: string, reason: string): Promise<void> {
    await rejectTimeEntry(entryId, reason)
}
