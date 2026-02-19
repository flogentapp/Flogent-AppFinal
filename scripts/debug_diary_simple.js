
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

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('Testing query on diary_entries...');
    const { data, error } = await supabase
        .from('diary_entries')
        .select(`
            *,
            template:diary_templates(*)
        `)
        .limit(1);

    if (error) {
        console.log('ERROR DETECTED:');
        console.log('Message:', error.message);
        console.log('Code:', error.code);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
        console.log('Full Error Object:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS:');
        console.log('Data count:', data.length);
        if (data.length > 0) {
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        }
    }

    console.log('\nChecking table Columns for diary_entries:');
    const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'diary_entries' });
    if (colErr) {
        // Fallback if RPC doesn't exist
        const { data: cols2, error: colErr2 } = await supabase.from('diary_entries').select('*').limit(0);
        if (colErr2) console.error('Could not get columns:', colErr2);
        else console.log('Columns appear to exist (empty select worked)');
    } else {
        console.log('Columns:', cols);
    }
}

test();
