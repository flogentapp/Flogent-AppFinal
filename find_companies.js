const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read keys from .env.local
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    var getEnv = (key) => {
        const match = envFile.match(new RegExp(key + '=(.*)'));
        return match ? match[1].trim() : null;
    };
} catch (e) {
    console.error('❌ Could not find .env.local file');
    process.exit(1);
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !key) {
    console.error('❌ Missing Supabase keys in .env.local');
    process.exit(1);
}

// 2. Connect & List
const supabase = createClient(url, key);

async function run() {
    console.log('\n🔍 SCANNING DATABASE...');
    const { data: tenants, error } = await supabase.from('tenants').select('id, name');

    if (error) {
        console.error('❌ DB Error:', error.message);
    } else if (!tenants || tenants.length === 0) {
        console.log('⚠️  No companies found.');
    } else {
        console.log('✅ FOUND COMPANIES:');
        tenants.forEach(t => {
            console.log('------------------------------------------------');
            console.log('📂 NAME: ' + t.name);
            console.log('🔑 ID:   ' + t.id);
        });
        console.log('------------------------------------------------\n');
    }
}
run();
