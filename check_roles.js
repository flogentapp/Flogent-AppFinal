const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
    const match = envFile.match(new RegExp(key + '=(.*)'));
    let val = match ? match[1].trim() : null;
    if (val && (val.startsWith('"') || val.startsWith("'"))) val = val.substring(1, val.length - 1);
    return val;
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key);

async function run() {
    // Try to get one row to see column names and types if possible, 
    // but better to check the enum values via a query.
    // Since I can't run raw SQL easily without a specific endpoint, 
    // I'll check what roles currently exist.
    const { data: roles } = await supabase.from('user_role_assignments').select('role').limit(10);
    console.log('Existing roles in DB:', [...new Set(roles.map(r => r.role))]);
}
run();
