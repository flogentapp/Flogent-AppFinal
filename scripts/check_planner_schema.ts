import { createAdminClient } from '../lib/supabase/admin'

async function checkSchema() {
    const admin = createAdminClient()

    console.log('--- Checking planner_tasks table ---')
    const { data: cols, error: colErr } = await admin.rpc('get_table_columns_info', { table_name: 'planner_tasks' })

    if (colErr) {
        console.log('Error or table not found:', colErr.message)

        // Try a direct query to see if it exists
        const { error: queryErr } = await admin.from('planner_tasks').select('count(*)').limit(1)
        if (queryErr) {
            console.log('Direct query failed:', queryErr.message)
        } else {
            console.log('Table exists but RPC failed.')
        }
    } else {
        console.log('Columns:', cols)
    }

    console.log('\n--- Checking subscriptions ---')
    const { data: subs, error: subErr } = await admin.from('tenant_app_subscriptions').select('*').limit(5)
    if (subErr) console.log('Sub error:', subErr.message)
    else console.log('Sample subs:', subs)
}

checkSchema()
