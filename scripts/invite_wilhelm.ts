
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

async function main() {
    console.log('Searching for Admin user "Carel"...')

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('first_name', '%Carel%')
        .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
        console.error('Could not find Admin user Carel', profileError)
        return
    }

    const admin = profiles[0]
    console.log(`Found Admin: ${admin.first_name} ${admin.last_name} (Tenant: ${admin.tenant_id})`)

    const email = 'Wilhelm@kuun.co.za'
    const firstName = 'Wilhelm'
    const lastName = 'Kuun'

    console.log(`Generating invite for ${email}...`)

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
            redirectTo: 'https://flogent-live-final.vercel.app/auth/confirm?next=/set-password',
            data: {
                tenant_id: admin.tenant_id,
                first_name: firstName,
                last_name: lastName,
                onboarded: true
            }
        }
    })

    if (linkError) {
        console.error('Generate Link Error:', linkError)
        return
    }

    let inviteLink = linkData.properties.action_link
    console.log('Original Link:', inviteLink)

    // Apply Safe Link Logic (Base64)
    try {
        const linkUrl = new URL(inviteLink)

        if (linkUrl.hostname === 'localhost') {
            linkUrl.hostname = 'flogent-live-final.vercel.app'
            linkUrl.protocol = 'https:'
            linkUrl.port = ''
        }

        const finalSupabaseUrl = linkUrl.toString()
        const encodedTarget = Buffer.from(finalSupabaseUrl).toString('base64')
        inviteLink = `https://flogent-live-final.vercel.app/auth/accept-invite?target=${encodedTarget}`

        console.log('Safe Link Generated:', inviteLink)
    } catch (e) {
        console.error('Url Parse Error', e)
    }

    // Send Email
    console.log('Sending Email via Mailjet...')

    // We can't import the lib file easily because of module resolution in ts-node without changes?
    // I'll copy the send logic here to be safe and fast.
    const MJ_API_KEY = '5e3dbca3693aaf93f0445f729dff5d95'
    const MJ_API_SECRET = 'e1e4cdce53c17f24504e4eba3045aef2'
    const auth = Buffer.from(`${MJ_API_KEY}:${MJ_API_SECRET}`).toString('base64')

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            Messages: [
                {
                    From: { Email: 'flogent.app@gmail.com', Name: 'Flogent App' },
                    To: [{ Email: email }],
                    Subject: `You've been invited to Flogent by ${admin.first_name} ${admin.last_name}`,
                    HTMLPart: `<h3>Welcome to Flogent</h3><p>Click here to join: <a href="${inviteLink}">Join Workspace</a></p>`
                }
            ]
        })
    })

    if (!response.ok) {
        console.error('Mailjet Error:', await response.text())
    } else {
        console.log('Email Sent Successfully!')
    }

    // Create Profile
    const invitedUser = linkData.user
    console.log('Creating Profile for:', invitedUser.id)

    const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
            id: invitedUser.id,
            tenant_id: admin.tenant_id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            status: 'invited',
            current_company_id: admin.current_company_id
        })

    if (insertError) console.error('Profile Error:', insertError)
    else console.log('Profile Created!')
}

main()
