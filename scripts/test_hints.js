
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testJoinHints() {
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

    console.log('Testing column-based join hints...');

    const { data, error } = await supabase
        .from('planner_tasks')
        .select(`
            id,
            assigned_to:profiles!assigned_to_id(first_name),
            marked_done_by:profiles!marked_done_by_id(first_name)
        `)
        .limit(1);

    if (error) {
        console.error('Error with column hints:', error.message);
    } else {
        console.log('Column-based hints worked!');
    }
}

testJoinHints();
