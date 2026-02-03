import { headers } from 'next/headers'

export async function sendCredentialsEmail(
    toEmail: string,
    tempPassword: string,
    inviterName: string,
    userName: string,
    tenantId: string
) {
    const MJ_API_KEY = process.env.MJ_API_KEY || process.env.MAILJET_API_KEY
    const MJ_API_SECRET = process.env.MJ_API_SECRET || process.env.MAILJET_SECRET_KEY

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
