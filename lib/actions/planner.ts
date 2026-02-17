'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getUserPermissions } from './permissions'

export async function getPlannerTasks() {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const permissions = await getUserPermissions()

    // Get profile via admin to bypass RLS issues
    const { data: profile } = await admin
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    // Use admin for fetching to ensure data visibility
    let query = admin
        .from('planner_tasks')
        .select(`
            *, 
            assigned_to:profiles!fk_planner_assignee(first_name, last_name, email), 
            project:projects(*),
            marked_done_by:profiles!planner_tasks_marked_done_by_id_fkey(first_name, last_name),
            deleted_by:profiles!fk_planner_deleter(first_name, last_name)
        `)
        .eq('tenant_id', profile.tenant_id)

    // Apply security filters if not owner
    if (!permissions.isOwner) {
        if (profile.current_company_id) {
            query = query.eq('company_id', profile.current_company_id)
        }
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
        console.error('Fetch Tasks Error:', JSON.stringify(error, null, 2))
        return []
    }

    return data || []
}

export async function createPlannerTask(formData: FormData) {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string
    const assignedToIdSet = formData.getAll('assigned_to_ids') as string[]
    const startBy = formData.get('start_by') as string
    const note = formData.get('note') as string
    const sendEmail = formData.get('send_email') === 'on'

    if (!projectId || !title) return { error: 'Missing required fields' }

    const { data: profile } = await admin.from('profiles').select('tenant_id, current_company_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profile not found' }

    const initialNotes = note ? [{ date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }), text: note }] : []

    const tasksToInsert = assignedToIdSet.length > 0 ? assignedToIdSet.map(assigneeId => ({
        tenant_id: profile.tenant_id,
        company_id: profile.current_company_id,
        project_id: projectId,
        title,
        assigned_to_id: assigneeId,
        start_by: startBy || null,
        status: 'New',
        notes: initialNotes,
        created_by: user.id
    })) : [{
        tenant_id: profile.tenant_id,
        company_id: profile.current_company_id,
        project_id: projectId,
        title,
        assigned_to_id: null,
        start_by: startBy || null,
        status: 'New',
        notes: initialNotes,
        created_by: user.id
    }]

    const { error: insertErr } = await admin.from('planner_tasks').insert(tasksToInsert)
    if (insertErr) return { error: insertErr.message }

    // 4. Send Notification Emails
    if (sendEmail && assignedToIdSet.length > 0) {
        const { sendTaskAssignedEmail } = await import('@/lib/mailjet')

        // Fetch assignee details for emails
        const { data: usersData } = await admin
            .from('profiles')
            .select('first_name, email')
            .in('id', assignedToIdSet)

        // Fetch project name
        const { data: project } = await admin
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()

        const assignerName = `${user.user_metadata?.first_name || 'Admin'} ${user.user_metadata?.last_name || ''}`.trim()
        const formattedDueDate = startBy ? new Date(startBy).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null

        if (usersData) {
            await Promise.allSettled(
                usersData.map(u =>
                    sendTaskAssignedEmail(
                        u.email,
                        u.first_name,
                        title,
                        project?.name || 'General',
                        assignerName,
                        formattedDueDate
                    )
                )
            )
        }
    }

    revalidatePath('/planner')
    revalidatePath('/app')
    return { success: true }
}

export async function updatePlannerTask(taskId: string, updates: any) {
    const admin = createAdminClient()
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (updates.status === 'Completed') {
        updates.completion_date = new Date().toISOString()
        updates.marked_done_by_id = user.id
    } else if (updates.status === 'New' || updates.status === 'Waiting') {
        // Reset metadata when restoring or moving back
        updates.completion_date = null
        updates.marked_done_by_id = null
        updates.deleted_at = null
        updates.deleted_by_id = null
    }

    const { error } = await admin
        .from('planner_tasks')
        .update(updates)
        .eq('id', taskId)

    if (error) return { error: error.message }

    revalidatePath('/planner')
    return { success: true }
}

export async function deletePlannerTask(taskId: string) {
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Add a note to history about the deletion
    const { data: task } = await admin.from('planner_tasks').select('notes').eq('id', taskId).single()
    const newNote = {
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        text: `Task deleted by ${user.user_metadata?.first_name || 'User'}`
    }
    const updatedNotes = [newNote, ...(task?.notes || [])]

    const { error } = await admin
        .from('planner_tasks')
        .update({
            status: 'Deleted',
            deleted_at: new Date().toISOString(),
            deleted_by_id: user.id,
            notes: updatedNotes
        })
        .eq('id', taskId)

    if (error) return { error: error.message }

    revalidatePath('/planner')
    return { success: true }
}

export async function addPlannerNote(taskId: string, noteText: string) {
    const admin = createAdminClient()
    if (!noteText) return { error: 'Empty note' }

    const { data: task } = await admin.from('planner_tasks').select('notes').eq('id', taskId).single()
    if (!task) return { error: 'Task not found' }

    const newNote = {
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        text: noteText
    }
    const updatedNotes = [newNote, ...(task.notes || [])]

    const { error } = await admin
        .from('planner_tasks')
        .update({ notes: updatedNotes })
        .eq('id', taskId)

    if (error) return { error: error.message }

    revalidatePath('/planner')
    return { success: true }
}

export async function setPlannerTaskWaiting(taskId: string, waitDays: number, reason: string, sendEmail: boolean) {
    const admin = createAdminClient()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const returnDateObj = new Date()
    returnDateObj.setDate(returnDateObj.getDate() + waitDays)
    const returnDateStr = returnDateObj.toISOString().split('T')[0]

    // 1. Update Task Status
    const { data: task, error: fetchErr } = await admin
        .from('planner_tasks')
        .select('*, project:projects(name)')
        .eq('id', taskId)
        .single()

    if (fetchErr) return { error: 'Task not found' }

    const { error: updateErr } = await admin
        .from('planner_tasks')
        .update({
            status: 'Waiting',
            start_by: returnDateStr
        })
        .eq('id', taskId)

    if (updateErr) return { error: updateErr.message }

    // 2. Add Note
    const newNote = {
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        text: `Status set to Waiting for ${waitDays} days. Reason: ${reason}`
    }
    const updatedNotes = [newNote, ...(task.notes || [])]
    await admin.from('planner_tasks').update({ notes: updatedNotes }).eq('id', taskId)

    // 3. Optional Email
    if (sendEmail) {
        const { sendWaitingReminderEmail } = await import('@/lib/mailjet')
        const firstName = user.user_metadata?.first_name || 'User'
        const email = user.email!

        const emailRes = await sendWaitingReminderEmail(
            email,
            firstName,
            task.title,
            task.project?.name || 'General',
            waitDays,
            new Date(returnDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            reason
        )

        if (!emailRes.success) {
            console.error('Email failed but task status updated:', emailRes.error)
        }
    }

    revalidatePath('/planner')
    return { success: true }
}
