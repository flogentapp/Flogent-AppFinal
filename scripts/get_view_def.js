
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function getViewDef() {
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

    const { data, error } = await supabase.rpc('get_view_definition', { view_name: 'v_time_entries_detailed' });

    if (error) {
        // Fallback: try to query pg_views directly if we have permission via a generic query tool if it exists, 
        // but typically we'd use a custom RPC or the SQL editor.
        console.log('Error getting view definition via RPC:', error.message);
        console.log('Try running this in SQL Editor to get the definition:');
        console.log("SELECT pg_get_viewdef('v_time_entries_detailed', true);");
    } else {
        console.log('View Definition:', data);
    }
}

getViewDef();
