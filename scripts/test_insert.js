
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

async function testInsert() {
    console.log('Testing dummy insert...');
    // We need a valid tenant_id, company_id, user_id, template_id.
    // Let's just try to insert an empty object and see the error.
    const { data, error } = await supabase.from('diary_entries').insert({}).select();

    if (error) {
        console.log('Insert Error:', error);
    } else {
        console.log('Insert Result:', data);
    }
}

testInsert();
