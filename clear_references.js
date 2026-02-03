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
    const goldId = '93e4cddf-7622-4e6f-8c05-41ba3df68d85'; // Carel
    const tables = [
        'companies', 'departments', 'projects', 'time_entries',
        'timesheets', 'user_role_assignments', 'project_memberships'
    ];
    const columns = ['created_by', 'updated_by', 'owner_user_id', 'user_id', 'approved_by', 'rejected_by', 'submitted_by'];

    console.log(`--- REASSIGNING ALL DATA TO GOLD ID: ${goldId} ---`);

    for (const table of tables) {
        for (const col of columns) {
            try {
                // We update ALL records that are NOT the gold ID to become the gold ID
                // except for 'user_id' in role assignments/memberships where we might want to keep some people
                // actually, let's just target the profiles the user wants to delete.

                // Get all profile IDs except gold
                const { data: profiles } = await supabase.from('profiles').select('id').neq('id', goldId);
                const idsToRemove = profiles.map(p => p.id);

                if (idsToRemove.length > 0) {
                    const { error } = await supabase.from(table).update({ [col]: goldId }).in(col, idsToRemove);
                    if (!error) console.log(`Updated ${table}.${col}`);
                }
            } catch (e) { }
        }
    }

    console.log('--- REASSIGNMENT COMPLETE ---');
}
run();
