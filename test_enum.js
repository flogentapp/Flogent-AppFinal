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
    const testRoles = ['User', 'Member', 'Employee', 'Staff', 'DepartmentHead', 'ProjectLeader', 'CEO'];
    const fakeId = '00000000-0000-0000-0000-000000000000';

    console.log('Testing role values...');
    for (const role of testRoles) {
        const { error } = await supabase.from('user_role_assignments').insert({
            tenant_id: fakeId,
            user_id: fakeId,
            role: role,
            scope_type: 'company',
            scope_id: fakeId
        }).select();

        if (error && error.message.includes('invalid input value for enum role_type')) {
            console.log(`❌ ${role}: Not valid`);
        } else if (error && error.code === '23503') { // Foreign key violation is GOOD - means the enum was accepted
            console.log(`✅ ${role}: Valid (accepted by enum)`);
        } else {
            console.log(`? ${role}: Result:`, error?.message || 'Success (unexpected)');
        }
    }
}
run();
