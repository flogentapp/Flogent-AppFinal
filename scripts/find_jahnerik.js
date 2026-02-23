
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

async function findJahnerik() {
    const { data, error } = await supabase.from('profiles').select('id,email,first_name,last_name,tenant_id').or('first_name.ilike.%Jahnerik%,last_name.ilike.%Fourie%');
    if (error) {
        fs.writeFileSync('scripts/jahnerik_out.txt', 'Error: ' + JSON.stringify(error));
    } else {
        let out = '';
        data.forEach(p => {
            out += `ID: ${p.id} | Email: ${p.email} | Name: ${p.first_name} ${p.last_name} | Tenant: ${p.tenant_id}\n`;
        });
        fs.writeFileSync('scripts/jahnerik_out.txt', out);
    }
}

findJahnerik();
