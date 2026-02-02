
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zwdlxuvwuulhmtsihepy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZGx4dXZ3dXVsaG10c2loZXB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY2NzI5OSwiZXhwIjoyMDgzMjQzMjk5fQ.qacQBAMXD0H1A4YzPHQU9jwoMGADMvcYNTaL-oyHWF0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getFunctionDef() {
    console.log('Fetching function definitions for onboard_new_tenant...')

    const { data, error } = await supabase.rpc('inspect_function', {
        fn_name: 'onboard_new_tenant'
    })

    if (error) {
        console.error('Error calling inspect_function:', error.message)
        console.log('Attempting manual query via postgrest if possible...')

        // Since I can't run raw SQL via RPC unless a helper exists, 
        // I'll try to list all overloads via a generic query to pg_proc if allowed
        const { data: procs, error: procError } = await supabase
            .from('pg_proc')
            .select('*, pg_namespace(nspname)')
            .eq('proname', 'onboard_new_tenant')

        if (procError) {
            console.error('Error querying pg_proc:', procError.message)
        } else {
            console.log('Found procs:', JSON.stringify(procs, null, 2))
        }
    } else {
        console.log('Function Definition:', data)
    }
}

getFunctionDef()
