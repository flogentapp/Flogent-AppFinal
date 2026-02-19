
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

async function testPlanner() {
    console.log('Testing planner_tasks select...');
    const { data, error } = await supabase.from('planner_tasks').select('*').limit(1);
    if (error) {
        console.log('Planner Error:', error);
    } else {
        console.log('Planner Success!');
    }
}

testPlanner();
