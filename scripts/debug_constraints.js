
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkConstraints() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = Object.fromEntries(
        envContent.split('\n')
            .filter(line => line.includes('=') && !line.startsWith('#'))
            .map(line => {
                const parts = line.trim().split('=');
                return [parts[0], parts.slice(1).join('=')];
            })
    );

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('Checking constraints for planner_tasks...');

    // We can query information_schema via a trick if RLS allows or if there's no helper
    // But usually we can use a direct select on a metadata table if allowed, or just try to join manually.

    // Let's try to join without hints to see if it works, or fetch raw data.
    const { data, error } = await supabase
        .from('planner_tasks')
        .select(`
            id,
            assigned_to_id,
            marked_done_by_id,
            deleted_by_id
        `)
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error.message);
        return;
    }
    console.log('Sample row data found.');

    // Since we can't easily query information_schema directly via PostgREST without an RPC, 
    // I will try to see if I can find what relationships exist by trying a query without hints first.
    const { data: joinData, error: joinErr } = await supabase
        .from('planner_tasks')
        .select('*, profiles!planner_tasks_assigned_to_id_fkey(first_name)')
        .limit(1);

    if (joinErr) {
        console.log('Join with default hint failed:', joinErr.message);
    } else {
        console.log('Join with default hint worked.');
    }
}

checkConstraints();
