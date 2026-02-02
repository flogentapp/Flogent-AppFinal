// @ts-nocheck
const MJ_API_KEY = process.env.MJ_API_KEY
const MJ_API_SECRET = process.env.MJ_API_SECRET

export async function sendInvitationEmail(toEmail, inviteLink, inviterName) { /* Legacy */ }

export async function sendCredentialsEmail(toEmail, tempPassword, inviterName, userName, tenantId) {
    if (!MJ_API_KEY || !MJ_API_SECRET) {
        console.error('❌ Mailjet Keys Missing')
        return { success: false, error: 'Server Config Error: Missing Mailjet Keys' }
    }

    try {
        const auth = Buffer.from(MJ_API_KEY + ':' + MJ_API_SECRET).toString('base64')
        const response = await fetch('https://api.mailjet.com/v3.1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth },
            body: JSON.stringify({
                Messages: [{
                    From: { Email: 'flogent.app@gmail.com', Name: 'Flogent Team' },
                    To: [{ Email: toEmail, Name: userName }],
                    Subject: 'You have been invited to Flogent',
                    HTMLPart: `
                        <h3>Welcome ${userName}</h3>
                        <p>Your admin (<strong>${inviterName}</strong>) has invited you to join their workspace.</p>
                        <div style="background:#f9fafb;padding:15px;border:1px solid #ddd;margin:20px 0">
                            <p><strong>Email:</strong> ${toEmail}</p>
                            <p><strong>Password:</strong> ${tempPassword}</p>
                            <p><strong>Workspace ID:</strong> <code>${tenantId}</code></p>
                        </div>
                        <p><a href="http://localhost:3000/login">Login Here</a></p>
                        <hr>
                        <p>Link broken? Go to <a href="http://localhost:3000/onboarding">Join Page</a> and enter Workspace ID.</p>
                    `
                }]
            })
        })
        const data = await response.json()
        if (!response.ok) return { success: false, error: data.ErrorMessage || 'Mailjet Error' }
        return { success: true, data: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}