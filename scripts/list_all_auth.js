
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

async function listAllAuth() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Total Auth Users:', users.length);
    users.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email}`));
}

listAllAuth();
