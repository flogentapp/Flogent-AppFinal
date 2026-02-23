
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

async function fixJahnerik() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const sanMariId = '7e4320c8-cb12-4997-b52a-25cfd22f921a';

    const { data: sanMari } = await supabase.from('profiles').select('*').eq('id', sanMariId).single();

    console.log(`Fixing Jahnerik Profile using San-Mari's context...`);

    const { error } = await supabase.from('profiles').update({
        tenant_id: sanMari.tenant_id,
        current_company_id: sanMari.current_company_id,
        status: 'active'
    }).eq('id', id);

    if (error) {
        console.error('Error fixing profile:', error);
    } else {
        console.log('Profile fixed successfully.');
    }
}

fixJahnerik();
