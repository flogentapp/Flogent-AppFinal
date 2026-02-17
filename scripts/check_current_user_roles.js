
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkUserRoles() {
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

    const email = 'wilhelmkuun1@gmail.com'; // Assuming this is the test user
    console.log(`Checking roles for ${email}...`);

    const { data: user } = await supabase.from('profiles').select('id, tenant_id').eq('email', email).single();

    if (!user) {
        console.log('User profile not found');
        return;
    }

    const { data: roles } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', user.id);

    console.log('User Roles:', roles);

    const { data: tenant } = await supabase
        .from('tenants')
        .select('owner_user_id')
        .eq('id', user.tenant_id)
        .single();

    console.log('Is Owner:', tenant?.owner_user_id === user.id);
}

checkUserRoles();
