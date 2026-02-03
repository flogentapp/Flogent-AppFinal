
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const email = 'Wilhelm@kuun.co.za';
    console.log(`Checking state for email: ${email}`);

    // 1. Get User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    // Find case-insensitive
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        console.log('User not found in Auth. All users:', users.map(u => u.email));
        return;
    }

    console.log('User ID:', user.id);
    console.log('Metadata:', JSON.stringify(user.user_metadata, null, 2));

    // 2. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    console.log('Profile:', JSON.stringify(profile, null, 2));

    if (profile && profile.tenant_id) {
        // 3. Get Tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();
        console.log('Tenant:', JSON.stringify(tenant, null, 2));

        // 4. Get Companies
        const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', profile.tenant_id);
        console.log('Companies in Tenant:', JSON.stringify(companies, null, 2));

        // 5. Get Roles
        const { data: roles } = await supabase
            .from('user_role_assignments')
            .select('*')
            .eq('user_id', user.id);
        console.log('Role Assignments:', JSON.stringify(roles, null, 2));
    } else {
        console.log('No Tenant ID in profile or profile not found');
    }
}

main();
