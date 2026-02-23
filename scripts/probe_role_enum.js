
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function probe() {
    const candidates = ['CEO', 'DepartmentHead', 'ProjectLeader', 'Admin', 'Member', 'User', 'member', 'owner', 'admin'];
    const results = {};

    for (const role of candidates) {
        const { error } = await supabase.from('user_role_assignments').insert({
            user_id: '00000000-0000-0000-0000-000000000099',
            role,
            scope_type: 'company',
            scope_id: '00000000-0000-0000-0000-000000000099'
        });

        if (error?.message?.includes('invalid input value')) {
            results[role] = '❌ INVALID';
        } else if (error?.code === '23503') {
            results[role] = '✅ VALID (FK error)';
        } else if (error?.message?.includes('null value') || error?.code === '23502') {
            results[role] = '✅ VALID (null constraint)';
        } else {
            results[role] = `? (${error?.message || 'no error'})`;
        }
    }

    const out = Object.entries(results).map(([k, v]) => `${v}: "${k}"`).join('\n');
    console.log(out);
    fs.writeFileSync('scripts/role_enum_results.txt', out, 'utf8');
}

probe();
