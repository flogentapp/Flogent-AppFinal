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
    console.log('--- CHECKING PROFILES ---');
    const { data: profiles } = await supabase.from('profiles').select('id, email, first_name, last_name, tenant_id');
    profiles.forEach(p => console.log(`Profile: ${p.id} | ${p.email} | Tenant: ${p.tenant_id}`));

    console.log('\n--- CHECKING AUTH ---');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    users.forEach(u => console.log(`Auth: ${u.id} | ${u.email}`));
}
run();
