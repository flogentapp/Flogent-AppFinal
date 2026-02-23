
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

async function checkColumns() {
    const tables = ['company_members', 'project_members', 'profiles'];
    let out = '';
    for (const table of tables) {
        const { data } = await supabase.from(table).select('*').limit(1);
        out += `Table: ${table} | Columns: ${Object.keys(data?.[0] || {})}\n`;
    }
    fs.writeFileSync('scripts/columns_check.txt', out);
}

checkColumns();
