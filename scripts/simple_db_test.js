
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkDatabaseType() {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = Object.fromEntries(
        envContent.split('\n')
            .filter(line => line.includes('=') && !line.startsWith('#'))
            .map(line => {
                const parts = line.trim().split('=');
                return [parts[0], parts.slice(1).join('=')];
            })
    );

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // This is a direct check against the catalog
    const { data, error } = await supabase
        .from('time_entries')
        .select('hours')
        .limit(1);

    if (error) {
        console.log('Error querying table:', error.message);
    } else {
        console.log('Successfully reached table. To check types, we really need the SQL Editor or a specific RPC.');
    }
}

checkDatabaseType();
