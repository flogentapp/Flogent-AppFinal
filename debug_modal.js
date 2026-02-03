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
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150';
    const { data: profiles } = await supabase.from('profiles').select('id, email, first_name, last_name').eq('tenant_id', tenantId);
    console.log('--- ALL TENANT PROFILES ---');
    profiles.forEach(p => console.log(`${p.first_name} ${p.last_name} | ${p.email} | ${p.id}`));

    // Check assignments for PARALLAX (5640243b-7f61-460d-9659-19bad6f35b43)
    const pid = '5640243b-7f61-460d-9659-19bad6f35b43';
    const { data: roles } = await supabase.from('user_role_assignments').select('user_id').eq('scope_id', pid);
    console.log('--- ROLES IN PARALLAX ---');
    console.log(roles);
}
run();
