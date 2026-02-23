
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

async function verify() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const { data: roles } = await supabase.from('user_role_assignments').select('*').eq('user_id', id);
    console.log('Jahnerik Roles:', JSON.stringify(roles, null, 2));
}

verify();
