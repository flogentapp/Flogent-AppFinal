const { createClient } = require('@supabase/supabase-js')

const url = "https://zwdlxuvwuulhmtsihepy.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0"

async function debugPermissions() {
    const supabase = createClient(url, key)

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const testUser = users.find(u => u.email === 'wilhelmkuun1@gmail.com')
    if (!testUser) return console.log('User not found')

    const [
        { data: roles },
        { data: memberships }
    ] = await Promise.all([
        supabase
            .from('user_role_assignments')
            .select('*')
            .eq('user_id', testUser.id),
        supabase
            .from('project_memberships')
            .select('*')
            .eq('user_id', testUser.id)
    ])

    console.log('Roles:', roles)
    console.log('Memberships:', memberships)
}

debugPermissions()
