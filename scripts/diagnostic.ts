import { createClient } from '@supabase/supabase-js'

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function checkStatus() {
    const supabase = createClient(url, key)

    // 1. Get the test user
    const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
    if (userErr) {
        console.log('Error listing users:', userErr.message)
        return
    }

    const testUser = users.find(u => u.email === 'wilhelmkuun1@gmail.com')
    if (!testUser) {
        console.log('Test user not found among', users.length, 'users')
        return
    }

    console.log('Found user:', testUser.email, 'ID:', testUser.id)

    // 2. Get profile and tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()

    if (!profile) {
        console.log('Profile not found')
        return
    }

    const tenantId = profile.tenant_id
    console.log('Tenant ID:', tenantId)

    // 3. Get subscriptions
    const { data: subs } = await supabase
        .from('tenant_app_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)

    console.log('Subscriptions:', JSON.stringify(subs, null, 2))

    // 4. Check if planner_tasks table exists
    const { error: tableError } = await supabase.from('planner_tasks').select('*', { count: 'exact', head: true })
    if (tableError) {
        console.log('planner_tasks table issue:', tableError.message)
    } else {
        console.log('planner_tasks table exists')
    }
}

checkStatus()
