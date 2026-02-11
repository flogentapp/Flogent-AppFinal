
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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

    const sql = `
        ALTER TABLE public.time_entries 
        ALTER COLUMN hours TYPE NUMERIC(12,4);

        ALTER TABLE public.time_entries
        ALTER COLUMN minutes TYPE NUMERIC(12,4);
    `;

    console.log('Applying migration to allow decimals...');

    // Supabase JS doesn't have a direct 'sql' method for DDL in the client usually, 
    // unless we use a specific RPC or the management API.
    // However, we can try to use a simple RPC if one exists, but usually there isn't one for arbitrary SQL.

    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(sql);
}

runMigration();
