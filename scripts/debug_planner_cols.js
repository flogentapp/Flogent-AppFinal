
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkCols() {
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

    console.log('Checking columns for planner_tasks...');
    const { data, error } = await supabase
        .from('planner_tasks')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Columns found:', Object.keys(data[0] || {}));
    }
}

checkCols();
