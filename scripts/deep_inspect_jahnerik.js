
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

async function deepInspect() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    let out = '';

    // 1. Check Auth User Metadata
    const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(id);
    out += '--- AUTH USER ---\n';
    if (authErr) out += 'Auth Error: ' + JSON.stringify(authErr) + '\n';
    else out += JSON.stringify({
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
    }, null, 2) + '\n';

    // 2. Check Profile Table
    const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', id).single();
    out += '\n--- PROFILE TABLE ---\n';
    if (profErr) out += 'Profile Error: ' + JSON.stringify(profErr) + '\n';
    else out += JSON.stringify(profile, null, 2) + '\n';

    fs.writeFileSync('scripts/jahnerik_debug.txt', out, 'utf8');
    console.log('Inspection written to scripts/jahnerik_debug.txt');
}

deepInspect();
