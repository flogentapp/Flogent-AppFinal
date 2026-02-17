const { createClient } = require('@supabase/supabase-js')

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function checkOwner() {
    const supabase = createClient(url, key)

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const testUser = users.find(u => u.email === 'wilhelmkuun1@gmail.com')

    if (!testUser) return console.log('User not found')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', testUser.id).single()
    if (!profile) return console.log('Profile not found')

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()
    console.log('Tenant:', tenant)

    if (tenant.owner_user_id === testUser.id) {
        console.log('USER IS OWNER')
    } else {
        console.log('USER IS NOT OWNER. Owner is:', tenant.owner_user_id)
    }
}

checkOwner()
