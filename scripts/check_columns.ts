import { createAdminClient } from './lib/supabase/admin'

async function checkColumns() {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('get_table_columns', { table_name: 'planner_tasks' })
    if (error) {
        // Alternative check if RPC not available
        const { data: cols, error: err } = await admin.from('planner_tasks').select('*').limit(0)
        console.log('Columns check (via select *):', err || 'Success')
    } else {
        console.log('Columns:', data)
    }
}

checkColumns()
