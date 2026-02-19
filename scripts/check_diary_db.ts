
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnostic() {
    console.log('Checking diary_templates...')
    const { data: templates, error: tErr } = await supabase.from('diary_templates').select('id, title')
    if (tErr) console.error('Templates Error:', tErr)
    else console.log('Templates found:', templates?.length)

    console.log('Checking diary_entries...')
    const { data: entries, error: eErr } = await supabase.from('diary_entries').select('id, user_id, entry_date, template_id')
    if (eErr) console.error('Entries Error:', eErr)
    else console.log('Entries found:', entries?.length)

    if (entries && entries.length > 0) {
        console.log('Sample entry:', entries[0])
    }
}

diagnostic()
