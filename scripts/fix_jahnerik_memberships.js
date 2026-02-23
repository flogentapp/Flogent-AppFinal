
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

async function fixMemberships() {
    const userId = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const companyId = '6820c73b-01a4-4b08-85d7-d6dab6ea2555';

    console.log(`Fixing memberships for user ${userId} in company ${companyId}...`);

    // 1. Ensure Company Membership
    const { error: ce } = await supabase.from('company_members').upsert({
        user_id: userId,
        company_id: companyId,
        role: 'member'
    });
    if (ce) console.error('Error adding company member:', ce);
    else console.log('Added to company_members.');

    // 2. Identify Projects from tasks
    const { data: tasks } = await supabase.from('planner_tasks').select('project_id').eq('assigned_to_id', userId);
    const projectIds = [...new Set(tasks.map(t => t.project_id).filter(id => !!id))];

    console.log(`Found ${projectIds.length} projects to add:`, projectIds);

    // 3. Add to Project Members
    for (const pid of projectIds) {
        const { error: pe } = await supabase.from('project_members').upsert({
            user_id: userId,
            project_id: pid,
            role: 'member'
        });
        if (pe) console.error(`Error adding to project ${pid}:`, pe);
        else console.log(`Added to project ${pid}.`);
    }

    // 4. Update Profile current_company_id
    const { error: upe } = await supabase.from('profiles').update({ current_company_id: companyId }).eq('id', userId);
    if (upe) console.error('Error updating profile:', upe);
    else console.log('Profile updated.');

    console.log('Membership fix complete.');
}

fixMemberships();
