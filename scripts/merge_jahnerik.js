
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

async function mergeJahnerik() {
    const fromId = 'fc34e2c2-bcf6-427c-8a41-7ee669a00d52'; // The one with 2 tasks
    const toId = 'c9ef9699-3620-4d04-bef3-e4732f038998';   // The one with 10 tasks

    console.log(`Merging tasks from ${fromId} to ${toId}...`);

    // Update assigned_to_id
    const r1 = await supabase.from('planner_tasks').update({ assigned_to_id: toId }).eq('assigned_to_id', fromId);
    console.log(`Updated assigned_to_id: ${r1.status}`);

    // Update marked_done_by_id
    const r2 = await supabase.from('planner_tasks').update({ marked_done_by_id: toId }).eq('marked_done_by_id', fromId);
    console.log(`Updated marked_done_by_id: ${r2.status}`);

    // Update deleted_by_id
    const r3 = await supabase.from('planner_tasks').update({ deleted_by_id: toId }).eq('deleted_by_id', fromId);
    console.log(`Updated deleted_by_id: ${r3.status}`);

    // Update created_by
    const r4 = await supabase.from('planner_tasks').update({ created_by: toId }).eq('created_by', fromId);
    console.log(`Updated created_by: ${r4.status}`);

    console.log('Merge complete.');
}

mergeJahnerik();
