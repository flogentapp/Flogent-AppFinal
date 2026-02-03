
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

async function listRoles() {
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150'; // Quantra
    const { data, error } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

listRoles();
