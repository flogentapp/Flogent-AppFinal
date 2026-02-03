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
    console.log('--- AUTH USERS ---');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const goldMap = {};
    users.forEach(u => {
        console.log(`Auth ID: ${u.id} | Email: ${u.email}`);
        goldMap[u.email.toLowerCase()] = u.id;
    });

    console.log('\n--- FINDING ORPHAN PROFILES ---');
    const { data: profiles } = await supabase.from('profiles').select('id, email, first_name, last_name');

    const toDelete = [];
    profiles.forEach(p => {
        const email = p.email.toLowerCase();
        const goldId = goldMap[email];
        if (goldId && p.id !== goldId) {
            toDelete.push({ id: p.id, email: p.email, name: `${p.first_name} ${p.last_name}` });
        }
    });

    console.log('Safe to delete (Profiles with no matching Auth ID):');
    console.log(JSON.stringify(toDelete, null, 2));

    console.log('\nKeep these (Profiles matching Auth ID):');
    profiles.forEach(p => {
        if (goldMap[p.email.toLowerCase()] === p.id) {
            console.log(`KEEP: ${p.id} | ${p.email}`);
        }
    });
}
run();
