
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function listAllConstraints() {
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

    console.log('Listing all constraints for planner_tasks...');

    // Using a query to information_schema.key_column_usage
    // This requires the service role key to have permissions to read it (usually does)
    const { data, error } = await supabase
        .from('planner_tasks')
        .select(`
            id
        `)
        .limit(1);

    // I'll try to use a direct fetch to see if it works
    const { data: fks, error: fkErr } = await supabase
        .rpc('get_table_constraints', { t_name: 'planner_tasks' });

    if (fkErr) {
        console.log('RPC get_table_constraints failed.');
        // Try another way - checking the error message of a failed join again but this time I'll use a bogus hint to see what it suggests
        const { error: bogusErr } = await supabase
            .from('planner_tasks')
            .select('*, profiles!bogus(id)')
            .limit(1);

        console.log('PostgREST Error Response:', JSON.stringify(bogusErr, null, 2));
    } else {
        console.log('Constraints:', fks);
    }
}

listAllConstraints();
