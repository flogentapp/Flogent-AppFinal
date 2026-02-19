
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

async function testJoin() {
    console.log('Testing JOIN query...');
    const { data, error } = await supabase
        .from('diary_entries')
        .select('*, diary_templates!inner(*)')
        .limit(1);

    if (error) {
        console.log('Join Error:', error);
    } else {
        console.log('Join Success!');
    }

    console.log('Testing JOIN query with specific FK...');
    // Try to guess the FK name if it follows convention
    const { data: data2, error: error2 } = await supabase
        .from('diary_entries')
        .select('*, diary_templates!diary_entries_template_id_fkey(*)')
        .limit(1);

    if (error2) {
        console.log('FK Join Error:', error2);
    } else {
        console.log('FK Join Success!');
    }
}

testJoin();
