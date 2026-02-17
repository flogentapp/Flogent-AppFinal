const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

async function check() {
    console.log('Fetching 1 row from planner_tasks...')
    const { data, error } = await admin.from('planner_tasks').select('*').limit(1)
    if (error) {
        console.error('Error fetching planner_tasks:', error)
    } else {
        console.log('Successfully fetched rows. Columns present:', Object.keys(data[0] || {}))
    }
}

check()
