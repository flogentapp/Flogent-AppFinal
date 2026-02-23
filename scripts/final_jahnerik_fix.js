
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

async function finalFix() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';

    // Get the correct IDs from the fixed profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    const tid = profile.tenant_id;
    const cid = profile.current_company_id;

    console.log(`Setting up memberships for ${id} in tenant ${tid} and company ${cid}`);

    // Company Membership
    await supabase.from('company_members').upsert({
        user_id: id,
        company_id: cid,
        tenant_id: tid,
        role: 'member'
    });

    // Projects (from tasks)
    const { data: tasks } = await supabase.from('planner_tasks').select('project_id').eq('assigned_to_id', id);
    const projectIds = [...new Set(tasks.map(t => t.project_id).filter(id => !!id))];

    for (const pid of projectIds) {
        await supabase.from('project_members').upsert({
            user_id: id,
            project_id: pid,
            tenant_id: tid,
            role: 'member'
        });
    }

    console.log('Final membership fix complete.');
}

finalFix();
