
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

async function listCompanies() {
    const tenantId = 'a7f82a79-7340-4a9d-83a4-f7de59746150';
    const { data } = await supabase.from('companies').select('*').eq('tenant_id', tenantId);
    console.log('Companies:', JSON.stringify(data, null, 2));
}

listCompanies();
