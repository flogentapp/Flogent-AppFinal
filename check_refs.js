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
    console.log('--- DEPARTMENTS ---');
    const { data: depts } = await supabase.from('departments').select('*');
    console.log(JSON.stringify(depts, null, 2));

    console.log('\n--- PROJECTS ---');
    const { data: projs } = await supabase.from('projects').select('*');
    console.log(JSON.stringify(projs, null, 2));

    console.log('\n--- COMPANIES ---');
    const { data: companies } = await supabase.from('companies').select('*');
    console.log(JSON.stringify(companies, null, 2));

    console.log('\n--- PROFILES FOR WILHELM ---');
    const { data: profs } = await supabase.from('profiles').select('*').ilike('email', '%wilhelm%');
    console.log(JSON.stringify(profs, null, 2));
}
run();
