const { createClient } = require('@supabase/supabase-js')

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function forceRevalidate() {
    const supabase = createClient(url, key)

    // User: Carel Kuun (kuun@quantra.co.za)
    const userId = "93e4cddf-7622-4e6f-8c05-41ba3df68d85"
    const tenantId = "a7f82a79-7340-4a9d-83a4-f7de59746150"

    console.log('Force enabling apps for Carel...')

    // Clear and reset
    await supabase.from('tenant_app_subscriptions').delete().eq('tenant_id', tenantId)

    const apps = ['timesheets', 'task_planner']
    for (const app of apps) {
        await supabase.from('tenant_app_subscriptions').insert({
            tenant_id: tenantId,
            app_name: app,
            enabled: true,
            subscribed_by: userId
        })
        console.log('Enabled:', app)
    }

    console.log('Done.')
}

forceRevalidate()
