
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local to avoid dotenv dependency
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.trim().split('='))
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairUser(email) {
    console.log(`Repairing roles for: ${email}`);

    // 1. Get User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        console.log('User not found');
        return;
    }

    // 2. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.tenant_id || !profile.current_company_id) {
        console.log('Profile incomplete (missing tenant or company)');
        return;
    }

    console.log(`User Profile found. Tenant: ${profile.tenant_id}, Company: ${profile.current_company_id}`);

    // 3. Check for existing role
    const { data: roles } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('scope_type', 'company')
        .eq('scope_id', profile.current_company_id);

    if (roles && roles.length > 0) {
        console.log('User already has a role in this company.');
        return;
    }

    // 4. Assign Member Role
    console.log('Assigning Member role...');
    const { error: insertError } = await supabase
        .from('user_role_assignments')
        .insert({
            user_id: user.id,
            tenant_id: profile.tenant_id,
            role: 'Member',
            scope_type: 'company',
            scope_id: profile.current_company_id
        });

    if (insertError) {
        console.error('Error assigning role:', insertError);
    } else {
        console.log('Repair Complete! User should now see ONLY their company.');
    }
}

repairUser('Wilhelm@kuun.co.za');
