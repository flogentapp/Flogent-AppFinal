
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkEveryJoin() {
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
    let output = '';

    const checks = [
        { name: 'Assignee', query: 'profiles(id)' },
        { name: 'Completer', query: 'profiles(id)' },
        { name: 'Deleter', query: 'profiles(id)' }
    ];

    for (const check of checks) {
        output += `\n--- Checking ${check.name} ---\n`;
        const { error } = await supabase
            .from('planner_tasks')
            .select(`id, profiles(first_name)`)
            .limit(1);

        if (error) {
            output += `Error: ${error.message}\n`;
            output += `Hint: ${error.hint}\n`;
            output += `Details: ${JSON.stringify(error.details, null, 2)}\n`;
        } else {
            output += `No ambiguity.\n`;
        }
    }

    fs.writeFileSync('ambiguity_results.txt', output);
    console.log('Results written to ambiguity_results.txt');
}

checkEveryJoin();
