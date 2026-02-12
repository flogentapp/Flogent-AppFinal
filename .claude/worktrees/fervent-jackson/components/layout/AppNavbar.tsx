import { createClient } from '@/lib/supabase/server'
import { NavbarContent } from './NavbarContent'

export async function AppNavbar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Try to fetch Profile (Allow failure)
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, first_name, last_name, current_company_id')
        .eq('id', user.id)
        .single()

    // 2. Fetch Companies (Only if we have a tenant)
    let companies: any[] = []
    if (profile?.tenant_id) {
        const { data } = await supabase
            .from('companies')
            .select('id, name')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'active')
            .order('name')
        companies = data || []
    }

    // 3. Fallback defaults (Ensures Navbar ALWAYS renders)
    // If no company is selected, default to the first one, or a placeholder
    const currentCompany = companies.find(c => c.id === profile?.current_company_id) 
        || companies[0] 
        || { id: '00000000-0000-0000-0000-000000000000', name: 'Select Company' }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : (user.email || 'User')
    const userEmail = user.email || ''

    return (
        <NavbarContent 
            userEmail={userEmail} 
            userName={userName}
            currentCompany={currentCompany}
            availableCompanies={companies}
        />
    )
}