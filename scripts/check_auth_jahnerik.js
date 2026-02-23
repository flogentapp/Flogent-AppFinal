
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

async function checkAuth() {
    console.log('Listing users from Auth...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Auth Error:', error);
        return;
    }

    const jahneriks = users.filter(u => u.email.toLowerCase().includes('jahnerik'));
    console.log('Jahneriks in Auth:', JSON.stringify(jahneriks.map(u => ({
        id: u.id,
        email: u.email,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at
    })), null, 2));

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').ilike('email', '%jahnerik%');
    console.log('Jahneriks in Profiles:', JSON.stringify(profiles, null, 2));
}

checkAuth();
