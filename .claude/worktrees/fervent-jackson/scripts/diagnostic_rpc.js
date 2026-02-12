
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zwdlxuvwuulhmtsihepy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoleColumns() {
    console.log('Checking user_role_assignments columns...')

    const { data, error } = await supabase
        .from('user_role_assignments')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error querying user_role_assignments:', error.message)
    } else {
        console.log('Columns:', Object.keys(data[0] || {}))
    }
}

checkRoleColumns()
