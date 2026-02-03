
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const email = 'Wilhelm@kuun.co.za' // Based on previous scripts
    console.log(`Checking state for email: ${email}`)

    // 1. Get User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
        console.log('User not found in Auth')
        return
    }

    console.log('User ID:', user.id)
    console.log('Metadata:', user.user_metadata)

    // 2. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    console.log('Profile:', profile)

    if (profile?.tenant_id) {
        // 3. Get Tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single()
        console.log('Tenant:', tenant)

        // 4. Get Companies
        const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
        console.log('Companies in Tenant:', companies)

        // 5. Get Roles
        const { data: roles } = await supabase
            .from('user_role_assignments')
            .select('*')
            .eq('user_id', user.id)
        console.log('Role Assignments:', roles)
    } else {
        console.log('No Tenant ID in profile')
    }
}

main()
