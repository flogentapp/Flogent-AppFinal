
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.trim().split('='))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listColumns() {
    const { data, error } = await supabase
        .from('project_memberships')
        .select('*')
        .limit(1);

    if (error) console.error(error);
    else console.log('Columns:', Object.keys(data[0] || {}));
}

listColumns();
