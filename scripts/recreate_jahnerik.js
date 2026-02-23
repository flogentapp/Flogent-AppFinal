
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

async function recreateJahnerik() {
    const targetId = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const email = 'jahnerik@quantra.co.za';
    const pass = 'Flogent2026!';

    console.log(`Re-creating Auth user for ${email} with ID ${targetId}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        id: targetId,
        email: email,
        password: pass,
        email_confirm: true,
        user_metadata: { first_name: 'Jahnerik', last_name: 'Fourie' }
    });

    if (error) {
        console.error('Error re-creating user:', error);
    } else {
        console.log('Success! User created in Auth with correct ID.');
        console.log('User Data:', JSON.stringify(data.user, null, 2));
    }
}

recreateJahnerik();
