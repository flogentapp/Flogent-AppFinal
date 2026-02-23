
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

async function inspectJahnerik() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { data: compMembers } = await supabase.from('company_members').select('*, company:companies(name)').eq('user_id', id);
    const { data: projMembers } = await supabase.from('project_members').select('*, project:projects(name)').eq('user_id', id);

    console.log('--- PROFILE ---');
    console.log(JSON.stringify(profile, null, 2));

    console.log('\n--- COMPANY MEMBERSHIPS ---');
    console.log(JSON.stringify(compMembers, null, 2));

    console.log('\n--- PROJECT MEMBERSHIPS ---');
    console.log(JSON.stringify(projMembers, null, 2));
}

inspectJahnerik();
