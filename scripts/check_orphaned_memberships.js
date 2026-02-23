
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

async function checkOrphaned() {
    const fromId = 'fc34e2c2-bcf6-427c-8a41-7ee669a00d52';
    const toId = 'c9ef9699-3620-4d04-bef3-e4732f038998';

    // Check if memberships still exist for fromId
    const { data: c1 } = await supabase.from('company_members').select('*').eq('user_id', fromId);
    const { data: p1 } = await supabase.from('project_members').select('*').eq('user_id', fromId);

    console.log('Orphaned Company Members:', c1);
    console.log('Orphaned Project Members:', p1);

    // Also find projects associated with his tasks
    const { data: tasks } = await supabase.from('planner_tasks').select('project_id').eq('assigned_to_id', toId);
    const projectIds = [...new Set(tasks.map(t => t.project_id).filter(id => !!id))];
    console.log('Project IDs from his tasks:', projectIds);

    // Find company for those projects
    if (projectIds.length > 0) {
        const { data: projects } = await supabase.from('projects').select('id, company_id, name').in('id', projectIds);
        console.log('Projects details:', projects);
    }
}

checkOrphaned();
