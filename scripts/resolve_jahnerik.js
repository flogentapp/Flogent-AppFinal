
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

async function fixAccess() {
    const keepId = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const deleteId = 'fc34e2c2-bcf6-427c-8a41-7ee669a00d52';
    const tempPass = 'Flogent2026!';

    console.log(`Resetting password for ${keepId}...`);
    const { data: u1, error: e1 } = await supabase.auth.admin.updateUserById(keepId, { password: tempPass });
    if (e1) console.error('Error resetting password:', e1);
    else console.log('Password reset successful.');

    console.log(`Deleting duplicate account ${deleteId}...`);
    // First delete from profiles to avoid FK issues if any, although auth delete usually triggers it if set up
    const { error: e2 } = await supabase.from('profiles').delete().eq('id', deleteId);
    if (e2) console.error('Error deleting profile:', e2);

    const { error: e3 } = await supabase.auth.admin.deleteUser(deleteId);
    if (e3) console.error('Error deleting auth user:', e3);
    else console.log('Duplicate account deleted.');

    console.log('Cleanup complete.');
}

fixAccess();
