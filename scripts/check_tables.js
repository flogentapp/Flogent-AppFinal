
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

async function checkFKs() {
    console.log('Checking Foreign Keys for diary_entries...');
    const query = `
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='diary_entries';
    `;

    // We can't run raw SQL easily via the client unless we have an RPC
    // Let's try to list all columns and see if Postgres is returning any errors

    console.log('Querying diary_entries columns...');
    const { data: cols, error } = await supabase.from('diary_entries').select('*').limit(0);
    if (error) {
        console.log('Error querying diary_entries:', error);
    } else {
        console.log('Successfully queried diary_entries');
    }

    console.log('Querying diary_templates columns...');
    const { data: templates, error: tErr } = await supabase.from('diary_templates').select('*').limit(0);
    if (tErr) {
        console.log('Error querying diary_templates:', tErr);
    } else {
        console.log('Successfully queried diary_templates');
    }
}

checkFKs();
