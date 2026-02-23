
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

async function checkEnum() {
    // Get all distinct roles currently stored
    const { data } = await supabase.from('user_role_assignments').select('role').limit(100);
    const roles = [...new Set(data?.map(r => r.role))];
    console.log('Existing roles in DB:', roles);

    // Try to insert with 'Admin' to see exact error
    const { error } = await supabase.from('user_role_assignments').insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        role: 'Admin',
        scope_type: 'company',
        scope_id: '00000000-0000-0000-0000-000000000001'
    });
    console.log('Admin insert error:', error?.message);

    // Try with lowercase 'admin'
    const { error: error2 } = await supabase.from('user_role_assignments').insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        role: 'admin',
        scope_type: 'company',
        scope_id: '00000000-0000-0000-0000-000000000001'
    });
    console.log('admin (lowercase) insert error:', error2?.message);
}

checkEnum();
