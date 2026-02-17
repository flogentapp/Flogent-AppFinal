const { createClient } = require('@supabase/supabase-js')

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function finalFix() {
    const supabase = createClient(url, key)

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === 'wilhelmkuun1@gmail.com')
    if (!user) return console.log('User not found')

    // 2. Get Tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile.tenant_id
    console.log('Tenant:', tenantId)

    // 3. Clear and Set subscriptions
    // We want to be absolutely sure.
    await supabase.from('tenant_app_subscriptions').delete().eq('tenant_id', tenantId)

    const apps = ['timesheets', 'task_planner', 'diary']
    for (const app of apps) {
        const { error } = await supabase.from('tenant_app_subscriptions').insert({
            tenant_id: tenantId,
            app_name: app,
            enabled: true,
            subscribed_by: user.id
        })
        if (error) console.log('Error inserting', app, error.message)
        else console.log('Enabled', app)
    }

    // 4. Verify
    const { data: subs } = await supabase.from('tenant_app_subscriptions').select('*').eq('tenant_id', tenantId)
    console.log('Final Subs:', JSON.stringify(subs, null, 2))
}

finalFix()
