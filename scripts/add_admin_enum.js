
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function addAdminEnum() {
    console.log('Adding Admin to role_type enum...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: "ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'Admin';"
    });

    if (error) {
        // Try direct query via pg approach
        console.log('RPC not available, trying alternative...');
        console.log('Error:', error.message);

        // Test if Admin now works with an insert attempt
        const { error: testErr } = await supabase.from('user_role_assignments').insert({
            user_id: '00000000-0000-0000-0000-000000000099',
            role: 'Admin',
            scope_type: 'company',
            scope_id: '00000000-0000-0000-0000-000000000099'
        });

        if (testErr?.message?.includes('invalid input value')) {
            console.log('❌ Admin still NOT valid - need to run SQL directly in Supabase dashboard');
            console.log('\nPlease run this SQL in your Supabase SQL editor:');
            console.log("ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'Admin';");
        } else {
            console.log('✅ Admin IS already valid!', testErr?.message);
        }
    } else {
        console.log('✅ Done!', data);

        // Verify
        const { error: testErr } = await supabase.from('user_role_assignments').insert({
            user_id: '00000000-0000-0000-0000-000000000099',
            role: 'Admin',
            scope_type: 'company',
            scope_id: '00000000-0000-0000-0000-000000000099'
        });
        console.log('Verification (expect FK error not enum error):', testErr?.message);
    }
}

addAdminEnum();
