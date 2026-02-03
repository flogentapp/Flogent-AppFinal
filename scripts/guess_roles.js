
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

async function inspectSchema() {
    // Try to find the check constraint details via a generic query if possible,
    // or just try common role names.
    const rolesToTest = ['Manager', 'Employee', 'Staff', 'Guest', 'Admin', 'Lead'];
    const testUserId = '93e4cddf-7622-4e6f-8c05-41ba3df68d85'; // Wilhelm

    for (const role of rolesToTest) {
        const { error } = await supabase.from('user_role_assignments').insert({
            user_id: testUserId,
            tenant_id: 'a7f82a79-7340-4a9d-83a4-f7de59746150',
            role: role,
            scope_type: 'company',
            scope_id: '682c73c7-01a4-4b08-85d7-d6dab6ea2555',
            created_by: testUserId
        });

        if (!error) {
            console.log(`✅ Success with role: ${role}`);
            // Delete it immediately to keep clean
            await supabase.from('user_role_assignments').delete().eq('user_id', testUserId).eq('role', role);
        } else {
            console.log(`❌ Failed with role: ${role} - ${error.message}`);
        }
    }
}

inspectSchema();
