
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

async function checkAll() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const tables = ['profiles', 'company_members', 'project_members', 'user_role_assignments', 'planner_tasks'];
    let out = '';

    for (const table of tables) {
        let q = supabase.from(table).select('*', { count: 'exact' });
        if (table === 'planner_tasks') q = q.or(`assigned_to_id.eq.${id},marked_done_by_id.eq.${id},created_by.eq.${id}`);
        else q = q.eq('user_id', id);

        const { data, count, error } = await q;
        out += `Table: ${table} | Count: ${count || 0} | Error: ${error ? JSON.stringify(error) : 'None'}\n`;
        if (data && data.length > 0) out += `Data: ${JSON.stringify(data[0], null, 2)}\n\n`;
    }

    fs.writeFileSync('scripts/comprehensive_audit.txt', out);
    console.log('Audit complete.');
}

checkAll();
