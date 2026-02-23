
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
    const { data, error } = await supabase.rpc('get_tables');
    if (error) {
        // Fallback to a manual query if get_tables RPC doesn't exist
        const { data: data2, error: error2 } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
        if (error2) {
            // Fallback to checking some likely names
            const likely = ['user_role_assignments', 'project_members', 'company_members', 'project_assignments'];
            let results = [];
            for (const t of likely) {
                const { error: e } = await supabase.from(t).select('id').limit(1);
                if (!e || e.code !== '42P01') results.push(t);
            }
            console.log('Likely tables found:', results);
        } else {
            console.log('Tables:', data2.map(t => t.tablename));
        }
    } else {
        console.log('Tables:', data);
    }
}

listTables();
