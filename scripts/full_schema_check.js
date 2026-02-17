
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function debugSchema() {
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

    console.log('--- Database Connection ---');
    console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);

    console.log('\n--- Information Schema Check ---');
    // Using a simple query that usually works via PostgREST if not blocked
    const { data: cols, error: err } = await supabase
        .from('planner_tasks')
        .select('*')
        .limit(0);

    if (err) {
        console.error('Error fetching planner_tasks:', err.message);
    } else {
        console.log('Table found.');
    }

    // Try to list ALL tables in public
    console.log('\n--- Checking Table existence ---');
    const { data: tables, error: tableErr } = await supabase
        .rpc('get_tables'); // Checking if this helper exists

    if (tableErr) {
        console.log('RPC get_tables failed, attempting direct query...');
    } else {
        console.log('Tables:', tables);
    }
}

debugSchema();
