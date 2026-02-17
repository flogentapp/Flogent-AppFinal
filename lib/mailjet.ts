import { headers } from 'next/headers'

export async function sendCredentialsEmail(
    toEmail: string,
    tempPassword: string,
    inviterName: string,
    userName: string,
    tenantId: string
) {
    const MJ_API_KEY = process.env.MAILJET_API_KEY || process.env.MJ_API_KEY || process.env.MJ_APIKEY_PUBLIC
    const MJ_API_SECRET = process.env.MAILJET_SECRET_KEY || process.env.MAILJET_API_SECRET || process.env.MJ_API_SECRET || process.env.MJ_APIKEY_PRIVATE

    // 1. Detect Host via headers
    let siteUrl = ''
    try {
        const h = await headers()
        const host = h.get('host')
        if (host) {
            const protocol = host.includes('localhost') ? 'http' : 'https'
            siteUrl = `${protocol}://${host}`
        }
    } catch (e) {
        // Headers not available
    }

    // 2. Fallback to Environment Variable or Default
    if (!siteUrl) {
        siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }

    console.log(`📧 Mailjet: Using Site URL: ${siteUrl}`)

    if (!MJ_API_KEY || !MJ_API_SECRET) {
        console.error('❌ Mailjet Keys Missing')
        return { success: false, error: 'Server Config Error: Missing Mailjet Keys (Vercel ENV not set)' }
    }

    try {
        const auth = Buffer.from(`${MJ_API_KEY}:${MJ_API_SECRET}`).toString('base64')
        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth },
            body: JSON.stringify({
                Messages: [{
                    From: { Email: 'flogent.app@gmail.com', Name: 'Flogent Team' },
                    To: [{ Email: toEmail, Name: userName }],
                    Subject: 'You have been invited to Flogent',
                    HTMLPart: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                            <h3 style="color: #4f46e5;">Welcome ${userName}</h3>
                            <p>You have been invited by <strong>${inviterName}</strong> to join their workspace on Flogent.</p>
                            
                            <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin:25px 0">
                                <p style="margin-top:0"><strong>Email:</strong> ${toEmail}</p>
                                <p><strong>Password:</strong> ${tempPassword}</p>
                                <p style="margin-bottom:0"><strong>Workspace ID:</strong> <code style="background:#fff; padding:2px 5px; border:1px solid #ddd;">${tenantId}</code></p>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${siteUrl}/onboarding?mode=join" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Workspace Now</a>
                            </div>

                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            
                            <p style="font-size: 12px; color: #6b7280;">
                                <strong>Instructions:</strong> After clicking the button above, you will be asked for your Workspace ID. 
                                Copy and paste the ID provided above: <code>${tenantId}</code>
                            </p>
                            
                            <p style="font-size: 11px; color: #9ca3af;">
                                Link broken? Go to <a href="${siteUrl}/onboarding">${siteUrl}/onboarding</a> manually and select "Have an ID?".
                            </p>
                        </div>
                    `
                }]
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('❌ Mailjet HTTP Error:', data)
            return { success: false, error: data.ErrorMessage || `Mailjet HTTP ${response.status}` }
        }

        const messageStatus = data.Messages?.[0]?.Status
        if (messageStatus !== 'success') {
            console.error('❌ Mailjet Send Error:', data.Messages?.[0]?.Errors || messageStatus)
            return { success: false, error: `Mailjet Status: ${messageStatus}` }
        }

        console.log('✅ Email Sent Successfully')
        return { success: true, data: data }
    } catch (error: any) {
        console.error('❌ System Error in sendCredentialsEmail:', error)
        return { success: false, error: error.message }
    }
}

export async function sendWaitingReminderEmail(
    toEmail: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    waitDays: number,
    returnDate: string,
    reason: string
) {
    const MJ_API_KEY = process.env.MAILJET_API_KEY || process.env.MJ_API_KEY || process.env.MJ_APIKEY_PUBLIC
    const MJ_API_SECRET = process.env.MAILJET_SECRET_KEY || process.env.MAILJET_API_SECRET || process.env.MJ_API_SECRET || process.env.MJ_APIKEY_PRIVATE

    if (!MJ_API_KEY || !MJ_API_SECRET) return { success: false, error: 'Missing Mailjet Keys' }

    try {
        const auth = Buffer.from(`${MJ_API_KEY}:${MJ_API_SECRET}`).toString('base64')
        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth },
            body: JSON.stringify({
                Messages: [{
                    From: { Email: 'flogent.app@gmail.com', Name: 'Flogent Planner' },
                    To: [{ Email: toEmail, Name: userName }],
                    Subject: `Task Waiting Reminder: ${taskTitle}`,
                    HTMLPart: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; border-top: 4px solid #f59e0b;">
                            <h3 style="color: #d97706; margin-top: 0;">Task Set to Waiting</h3>
                            <p>Hi ${userName},</p>
                            <p>You've set the following task to <strong>Waiting</strong> for <strong>${waitDays}</strong> days.</p>
                            
                            <div style="background:#fffcf2; padding:20px; border-radius:10px; border:1px solid #fef3c7; margin:20px 0;">
                                <div style="margin-bottom:12px;">
                                    <span style="color:#92400e; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Task</span><br/>
                                    <strong style="font-size:16px;">${taskTitle}</strong>
                                </div>
                                <div style="margin-bottom:12px;">
                                    <span style="color:#92400e; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Project</span><br/>
                                    <strong>${projectName}</strong>
                                </div>
                                <div style="margin-bottom:12px;">
                                    <span style="color:#92400e; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Follow up on</span><br/>
                                    <strong>${returnDate}</strong>
                                </div>
                                <div>
                                    <span style="color:#92400e; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Reason</span><br/>
                                    <i style="color:#78350f;">"${reason || 'No reason specified'}"</i>
                                </div>
                            </div>
                            
                            <p style="font-size:13px; color:#6b7280; line-height:1.6;">
                                This email serves as a reminder that this task is now in your backlog and will be brought back to your active list on the date above.
                            </p>
                            
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                            <p style="font-size: 11px; color: #9ca3af; text-align: center;">Flogent Project Planner</p>
                        </div>
                    `
                }]
            })
        })

        if (!response.ok) return { success: false, error: 'Mailjet API error' }
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function sendTaskAssignedEmail(
    toEmail: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    assignerName: string,
    dueDate: string | null
) {
    const MJ_API_KEY = process.env.MAILJET_API_KEY || process.env.MJ_API_KEY || process.env.MJ_APIKEY_PUBLIC
    const MJ_API_SECRET = process.env.MAILJET_SECRET_KEY || process.env.MAILJET_API_SECRET || process.env.MJ_API_SECRET || process.env.MJ_APIKEY_PRIVATE

    if (!MJ_API_KEY || !MJ_API_SECRET) return { success: false, error: 'Missing Mailjet Keys' }

    try {
        const auth = Buffer.from(`${MJ_API_KEY}:${MJ_API_SECRET}`).toString('base64')
        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth },
            body: JSON.stringify({
                Messages: [{
                    From: { Email: 'flogent.app@gmail.com', Name: 'Flogent Planner' },
                    To: [{ Email: toEmail, Name: userName }],
                    Subject: `New Task Assigned: ${taskTitle}`,
                    HTMLPart: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; border-top: 4px solid #4f46e5;">
                            <h3 style="color: #4f46e5; margin-top: 0;">New Task Assigned</h3>
                            <p>Hi ${userName},</p>
                            <p><strong>${assignerName}</strong> has assigned a new task to you.</p>
                            
                            <div style="background:#f9fafb; padding:20px; border-radius:10px; border:1px solid #e5e7eb; margin:20px 0;">
                                <div style="margin-bottom:12px;">
                                    <span style="color:#6b7280; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Task</span><br/>
                                    <strong style="font-size:16px;">${taskTitle}</strong>
                                </div>
                                <div style="margin-bottom:12px;">
                                    <span style="color:#6b7280; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Project</span><br/>
                                    <strong>${projectName}</strong>
                                </div>
                                ${dueDate ? `
                                <div>
                                    <span style="color:#6b7280; font-size:10px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase;">Due Date</span><br/>
                                    <strong>${dueDate}</strong>
                                </div>
                                ` : ''}
                            </div>
                            
                            <p style="font-size:13px; color:#6b7280; line-height:1.6;">
                                You can view this task in your Project Planner and start tracking progress.
                            </p>
                            
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                            <p style="font-size: 11px; color: #9ca3af; text-align: center;">Flogent Project Planner</p>
                        </div>
                    `
                }]
            })
        })

        if (!response.ok) return { success: false, error: 'Mailjet API error' }
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
