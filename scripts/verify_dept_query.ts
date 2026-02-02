import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: any = {}
envContent.split('\n').forEach(line => {
    const parts = line.split('=')
    const key = parts[0]
    const value = parts.slice(1).join('=') // Handle values with =
    if (key && value) {
        env[key.trim()] = value.trim()
    }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys')
    process.exit(1)
}

console.log('Connecting to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Testing Project Query...')
    const { data, error } = await supabase
        .from('projects')
        .select('*, departments(name)')
        .limit(1)

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS: Query worked.')
        if (data && data.length > 0) {
            console.log('Sample data:', JSON.stringify(data[0], null, 2))
        } else {
            console.log('No projects found, but query structure is valid.')
        }
    }
}

main()
