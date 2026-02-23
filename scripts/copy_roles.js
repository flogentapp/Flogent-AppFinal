
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

async function copyRoles() {
    const sanMariId = '7e4320c8-cb12-4997-b52a-25cfd22f921a';
    const jahnerikId = 'c9ef9699-3620-4d04-bef3-e4732f038998';

    const { data: sanMariRoles } = await supabase.from('user_role_assignments').select('*').eq('user_id', sanMariId);

    if (!sanMariRoles || sanMariRoles.length === 0) {
        console.log('San-Mari has no roles?');
        return;
    }

    const { data: profile } = await supabase.from('profiles').select('created_by').eq('id', jahnerikId).single();
    const creatorId = profile.created_by;

    console.log(`Copying ${sanMariRoles.length} roles. Using creator ID: ${creatorId}`);

    for (const role of sanMariRoles) {
        const { id, created_at, updated_at, ...rest } = role;
        const newRole = {
            ...rest,
            user_id: jahnerikId,
            created_by: creatorId || null
        };

        const { error } = await supabase.from('user_role_assignments').insert(newRole);
        if (error) console.error('Error inserting role:', error);
        else console.log(`Inserted role: ${role.role} for scope ${role.scope_type}`);
    }

    console.log('Role copy complete.');
}

copyRoles();
