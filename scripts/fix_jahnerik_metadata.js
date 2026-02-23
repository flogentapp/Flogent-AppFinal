
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

async function fixMetadata() {
    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150';

    console.log(`Setting tenant_id in Auth metadata for ${id}...`);

    const { data, error } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
            first_name: 'Jahnerik',
            last_name: 'Fourie',
            tenant_id: tenantId
        }
    });

    if (error) {
        console.error('Error updating metadata:', error);
    } else {
        console.log('Success! Auth metadata updated with tenant_id.');
        console.log('Updated Metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    }
}

fixMetadata();
