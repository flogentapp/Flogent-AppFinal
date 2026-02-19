
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

async function testExplicit() {
    console.log('Testing explicit column select...');
    const { data, error } = await supabase.from('diary_entries').select('id, entry_date').limit(1);
    if (error) {
        console.log('Explicit Error:', error);
    } else {
        console.log('Explicit Success!', data);
    }
}

testExplicit();
