
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

async function listTables() {
    const tables = ['profiles', 'tenants', 'companies', 'projects', 'diary_templates', 'diary_entries', 'planner_tasks'];

    for (const table of tables) {
        // Try a simple select 1 or similar
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`Table [${table}]: ERROR (${error.message})`);
        } else {
            console.log(`Table [${table}]: OK`);
        }
    }
}

listTables();
