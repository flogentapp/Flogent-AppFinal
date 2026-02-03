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
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150';

    const mappings = [
        { ghost: 'b8292916-91a5-4264-9b48-e74aa7d93d95', real: '7341d8fe-ef98-4b2a-ad57-47498074b285', email: 'wilhelm@kuun.co.za' },
        { ghost: '439fa57d-37fe-421c-ae99-618f17e92391', real: 'f3ed54c5-b6cd-476b-95e0-79e801bcb1a9', email: 'wilhelm@parallaxtechnologies.co.za' }
    ];

    const tables = [
        'user_role_assignments', 'project_memberships', 'time_entries',
        'departments', 'projects', 'tenants', 'companies'
    ];

    const columns = ['user_id', 'created_by', 'updated_by', 'owner_user_id', 'approved_by', 'rejected_by', 'submitted_by'];

    console.log('--- STARTING CLEANUP ---');

    for (const m of mappings) {
        console.log(`Processing ${m.email}: Ghost ${m.ghost} -> Real ${m.real}`);

        // 1. Relink all tables
        for (const table of tables) {
            for (const col of columns) {
                try {
                    await supabase.from(table).update({ [col]: m.real }).eq(col, m.ghost);
                } catch (e) { }
            }
        }

        // 2. Ensure Real Profile exists and has correct data
        // Get ghost profile data to preserve first/last name if real profile is empty
        const { data: ghostProfile } = await supabase.from('profiles').select('*').eq('id', m.ghost).single();

        const { error: upsertErr } = await supabase.from('profiles').upsert({
            id: m.real,
            email: m.email,
            tenant_id: tenantId,
            first_name: ghostProfile?.first_name || 'Wilhelm',
            last_name: ghostProfile?.last_name || 'Kuun',
            status: 'active'
        });

        if (upsertErr) console.error(`Error updating real profile ${m.real}:`, upsertErr);

        // 3. Delete Ghost Profile
        await supabase.from('profiles').delete().eq('id', m.ghost);
    }

    // 4. Delete all OTHER orphan profiles for these emails
    const emails = ['wilhelm@kuun.co.za', 'wilhelm@parallaxtechnologies.co.za', 'wilhelmkuun1@gmail.com', 'kuun@quantra.co.za'];
    const realIds = ['7341d8fe-ef98-4b2a-ad57-47498074b285', 'f3ed54c5-b6cd-476b-95e0-79e801bcb1a9', '93e4cddf-7622-4e6f-8c05-41ba3df68d85'];

    const { data: orphans } = await supabase.from('profiles').select('id, email').in('email', emails);
    for (const o of orphans) {
        if (!realIds.includes(o.id)) {
            console.log(`Deleting orphan: ${o.email} (${o.id})`);
            await supabase.from('profiles').delete().eq('id', o.id);
        }
    }

    console.log('--- CLEANUP COMPLETE ---');
}
run();
