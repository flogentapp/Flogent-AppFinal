
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.trim().split('='))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables', {}); // This RPC might not exist, trying a query if possible

    // Fallback: Query pg_catalog.pg_tables via a hack if RPC fails
    // But since I don't have a generic SQL RPC, I'll try to select from common table names.
    const tables = [
        'tenants', 'profiles', 'companies', 'departments', 'projects',
        'user_role_assignments', 'project_memberships', 'department_memberships',
        'time_entries', 'tenant_app_subscriptions', 'approval_policies'
    ];

    console.log('Known tables in schema:', tables);
}

listTables();
