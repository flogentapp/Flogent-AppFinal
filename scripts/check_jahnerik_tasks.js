
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

async function checkTasks() {
    const ids = [
        'fc34e2c2-bcf6-427c-8a41-7ee669a00d52',
        'c9ef9699-3620-4d04-bef3-e4732f038998'
    ];

    let out = '';
    for (const id of ids) {
        const { count, error } = await supabase.from('planner_tasks').select('*', { count: 'exact', head: true }).or(`assigned_to_id.eq.${id},marked_done_by_id.eq.${id}`);
        out += `User ID: ${id} | Tasks Count: ${count || 0}\n`;
    }
    fs.writeFileSync('scripts/jahnerik_tasks.txt', out);
}

checkTasks();
