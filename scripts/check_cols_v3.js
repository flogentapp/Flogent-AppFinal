
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

async function checkCols() {
    // Try to get one record or if zero, use a hack to see columns
    // We'll use a script that tries to insert a dummy record with incorrect data to trigger an error message that lists columns or just use the metadata.
    // Actually, let's use the profiles table as a reference for tenant_id.

    const id = 'c9ef9699-3620-4d04-bef3-e4732f038998';
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    const tenantId = profile.tenant_id;
    const companyId = profile.current_company_id;

    console.log('Tenant:', tenantId);
    console.log('Company:', companyId);

    // Try to find ANY record in company_members to see its cols
    const { data: anyMember } = await supabase.from('company_members').select('*').limit(1);
    if (anyMember && anyMember.length > 0) {
        console.log('Company Member Cols:', Object.keys(anyMember[0]));
    } else {
        console.log('company_members is empty.');
    }

    const { data: anyProjMember } = await supabase.from('project_members').select('*').limit(1);
    if (anyProjMember && anyProjMember.length > 0) {
        console.log('Project Member Cols:', Object.keys(anyProjMember[0]));
    } else {
        console.log('project_members is empty.');
    }
}

checkCols();
