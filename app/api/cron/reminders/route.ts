import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitingReminderEmail } from '@/lib/mailjet'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // 1. Verify Authorization (Optional but recommended for cron)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // 2. Fetch tasks needing reminders
    // We need the user's email too, so we join with profiles (or auth.users if possible, but admin can do it)
    // Actually, profiles table usually stores email or we can fetch from auth.admin
    const { data: tasks, error } = await admin
        .from('planner_tasks')
        .select(`
            *,
            project:projects(name),
            reminder_user:profiles!reminder_user_id(first_name, email)
        `)
        .eq('reminder_email_requested', true)
        .eq('reminder_email_sent', false)
        .lte('reminder_date', today)

    if (error) {
        console.error('CRON: Error fetching reminders:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tasks || tasks.length === 0) {
        return NextResponse.json({ message: 'No reminders to send today.' })
    }

    const results = []

    // 3. Process each reminder
    for (const task of tasks) {
        try {
            const userEmail = task.reminder_user?.email
            const userName = task.reminder_user?.first_name || 'User'

            if (!userEmail) {
                console.warn(`CRON: No email found for user ${task.reminder_user_id} on task ${task.id}`)
                continue
            }

            // Get wait days for the email template
            const todayDate = new Date()
            const returnDate = new Date(task.start_by)
            const waitDays = Math.ceil((returnDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))

            const emailRes = await sendWaitingReminderEmail(
                userEmail,
                userName,
                task.title,
                task.project?.name || 'General',
                waitDays,
                returnDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                '' // Reason is already in the notes history
            )

            if (emailRes.success) {
                await admin
                    .from('planner_tasks')
                    .update({ reminder_email_sent: true })
                    .eq('id', task.id)

                results.push({ taskId: task.id, status: 'sent' })
            } else {
                console.error(`CRON: Failed to send email for task ${task.id}:`, emailRes.error)
                results.push({ taskId: task.id, status: 'failed', error: emailRes.error })
            }
        } catch (e: any) {
            console.error(`CRON: Exception processing task ${task.id}:`, e)
            results.push({ taskId: task.id, status: 'error', message: e.message })
        }
    }

    return NextResponse.json({
        message: `Processed ${tasks.length} reminders.`,
        results
    })
}
