
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

async function testDepartmentRoles() {
    const roles = ['User', 'Member', 'DepartmentHead', 'ProjectLeader'];
    const testUserId = '93e4cddf-7622-4e6f-8c05-41ba3df68d85'; // Wilhelm
    // We need a department ID. I'll search for one.
    const { data: depts } = await supabase.from('departments').select('id').limit(1);
    const deptId = depts?.[0]?.id;

    if (!deptId) {
        console.log('No department found to test.');
        return;
    }

    for (const role of roles) {
        const { error } = await supabase.from('user_role_assignments').insert({
            user_id: testUserId,
            tenant_id: 'a7f82a79-7340-4a9d-83a4-f7de59746150',
            role: role,
            scope_type: 'department',
            scope_id: deptId,
            created_by: testUserId
        });

        if (!error) {
            console.log(`✅ Role "${role}" is ALLOWED for department scope.`);
            await supabase.from('user_role_assignments').delete().eq('user_id', testUserId).eq('role', role);
        } else {
            console.log(`❌ Role "${role}" failed for department scope: ${error.message}`);
        }
    }
}

testDepartmentRoles();
