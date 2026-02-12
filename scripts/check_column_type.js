
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkColumns() {
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

    // Querying the information_schema to see the actual data type
    const { data, error } = await supabase.rpc('get_column_type', {
        t_name: 'time_entries',
        c_name: 'hours'
    });

    if (error) {
        // Fallback: try to just select the column and check the type if possible, 
        // but let's try a direct query via a common helper if available
        console.log('Error checking type:', error.message);
        console.log('Trying an alternative check...');

        // Let's try to just insert a decimal locally to see if it works
        const { error: insError } = await supabase.from('time_entries').insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy
            tenant_id: '00000000-0000-0000-0000-000000000000',
            project_id: '00000000-0000-0000-0000-000000000000',
            entry_date: '2026-01-01',
            hours: 1.11,
            description: 'test'
        });

        if (insError && insError.message.includes('integer')) {
            console.log('CONFIRMED: Database still sees "hours" as an integer.');
        } else {
            console.log('Database seems to accept decimals locally or gave a different error.');
            if (insError) console.log('Error detail:', insError.message);
        }
    } else {
        console.log('Column "hours" type is:', data);
    }
}

checkColumns();
