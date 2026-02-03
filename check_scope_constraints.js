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
    const userId = '93e4cddf-7622-4e6f-8c05-41ba3df68d85'; // Carel

    // Get a department ID
    const { data: depts } = await supabase.from('departments').select('id').limit(1);
    const deptId = depts[0]?.id;

    // Get a project ID
    const { data: projs } = await supabase.from('projects').select('id').limit(1);
    const projId = projs[0]?.id;

    console.log('--- TESTING ROLES FOR DEPT AND PROJECT ---');

    const tests = [
        { role: 'DepartmentHead', type: 'department', id: deptId },
        { role: 'ProjectLeader', type: 'project', id: projId },
        { role: 'User', type: 'department', id: deptId },
        { role: 'User', type: 'project', id: projId },
        { role: 'CEO', type: 'company', id: '682c73c7-01a4-4b08-85d7-d6dab6ea2555' }
    ];

    for (const t of tests) {
        const { error } = await supabase.from('user_role_assignments').insert({
            tenant_id: tenantId,
            user_id: userId,
            role: t.role,
            scope_type: t.type,
            scope_id: t.id
        });

        if (!error) {
            console.log(`✅ ${t.role} on ${t.type}: SUCCESS`);
            await supabase.from('user_role_assignments').delete().eq('user_id', userId).eq('role', t.role).eq('scope_id', t.id);
        } else {
            console.log(`❌ ${t.role} on ${t.type}: ${error.message}`);
        }
    }
}
run();
