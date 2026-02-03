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
    const rolesToTest = [
        'CEO', 'Admin', 'Manager', 'User', 'Employee', 'Member', 'DepartmentHead', 'ProjectLeader', 'Staff'
    ];

    // Use the real tenant and a real user to avoid other constraints
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150';
    const userId = '93e4cddf-7622-4e6f-8c05-41ba3df68d85'; // Carel
    const companyId = '682c73c7-01a4-4b08-85d7-d6dab6ea2555'; // QUANTRA

    console.log('--- TESTING ROLES IN REAL CONTEXT ---');
    for (const r of rolesToTest) {
        const { error } = await supabase.from('user_role_assignments').insert({
            tenant_id: tenantId,
            user_id: userId,
            role: r,
            scope_type: 'company',
            scope_id: companyId
        });

        if (!error) {
            console.log(`✅ ${r}: SUCCESS`);
            // Clean up
            await supabase.from('user_role_assignments').delete().eq('user_id', userId).eq('role', r).eq('scope_id', companyId);
        } else {
            console.log(`❌ ${r}: ${error.message}`);
        }
    }
}
run();
