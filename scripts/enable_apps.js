const { createClient } = require('@supabase/supabase-js')

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function enableApps() {
    const supabase = createClient(url, key)

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const testUser = users.find(u => u.email === 'wilhelmkuun1@gmail.com')
    if (!testUser) return console.log('User not found')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', testUser.id).single()
    const tenantId = profile.tenant_id

    const apps = ['timesheets', 'task_planner']

    for (const app of apps) {
        console.log(`Enabling ${app}...`)
        const { error } = await supabase
            .from('tenant_app_subscriptions')
            .upsert({
                tenant_id: tenantId,
                app_name: app,
                enabled: true,
                subscribed_by: testUser.id
            }, {
                onConflict: 'tenant_id,app_name'
            })

        if (error) console.log(`Error enabling ${app}:`, error.message)
        else console.log(`Successfully enabled ${app}`)
    }
}

enableApps()
