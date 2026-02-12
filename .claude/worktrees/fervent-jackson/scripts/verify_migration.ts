
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zwdlxuvwuulhmtsihepy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('Checking profiles table...')
    const { data, error } = await supabase
        .from('profiles')
        .select('current_company_id')
        .limit(1)

    if (error) {
        console.log('Error querying profiles:', error.message)
        // If error is related to missing column, it will say "column current_company_id does not exist"
        if (error.message.includes('column "current_company_id" does not exist') || error.message.includes('Select query has failed')) {
            console.log('Verification Failed: Column missing')
        }
    } else {
        console.log('Verification Success: Column exists')
    }
}

verify()
