
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL')) {
        console.log(`URL: ${value.join('=').trim()}`);
    }
});
