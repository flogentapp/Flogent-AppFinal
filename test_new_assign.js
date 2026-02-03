const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
    const match = envFile.match(new RegExp(key + '=(.*)'));
    let val = match ? match[1].trim() : null;
    if (val && (val.startsWith('"') || val.startsWith("'"))) val = val.substring(1, val.length - 1);
    return val;
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key);

async function run() {
    const userId = '7341d8fe-ef98-4b2a-ad57-47498074b285'; // Wilhelm Real
    const parallaxId = '5640243b-7f61-460d-9659-19bad6f35b43'; // Parallax

    // Get first project in Parallax
    const { data: projs } = await supabase.from('projects').select('id').eq('company_id', parallaxId).limit(1);
    const projId = projs[0]?.id;

    console.log('Target Project:', projId);

    if (projId) {
        const { error } = await supabase.from('project_memberships').upsert({
            project_id: projId,
            user_id: userId,
            role: 'User'
        }, { onConflict: 'project_id,user_id' });

        if (error) console.error('Error:', error.message);
        else console.log('Successfully assigned Wilhelm to Parallax project!');
    } else {
        console.log('No project found in Parallax. Creating one...');
        const { data: newProj, error: pErr } = await supabase.from('projects').insert({
            company_id: parallaxId,
            tenant_id: 'a7f82a79-7340-4a9d-83a4-f7de59746150',
            name: 'General',
            status: 'active'
        }).select().single();

        if (pErr) {
            console.error('Failed to create project:', pErr.message);
            return;
        }

        await supabase.from('project_memberships').insert({
            project_id: newProj.id,
            user_id: userId,
            role: 'User'
        });
        console.log('Created project and assigned user!');
    }
}
run();
