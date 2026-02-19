
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getDiaryTemplates, getDailyDiaryEntries, getDiaryComplianceOverview } from '@/lib/actions/diary'
import { DiaryClient } from '@/components/diary/DiaryClient'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function DiaryPage(props: { searchParams: Promise<{ date?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const date = searchParams.date || format(new Date(), 'yyyy-MM-dd')

    // Fetch user profile (still needed for currentUser prop)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*') // Removed user_role_assignments as permissions are now handled by getUserPermissions
        .eq('id', user.id)
        .single()

    const permissions = await getUserPermissions()
    const isCEO = permissions.isOwner || permissions.isCEO || permissions.isAdmin

    const [templates, initialEntries, compliance] = await Promise.all([
        getDiaryTemplates(),
        getDailyDiaryEntries(date),
        isCEO ? getDiaryComplianceOverview(date) : Promise.resolve([])
    ])

    // Get users for the CEO's overview - strictly filtered by company if not owner
    let usersQuery = supabase
        .from('profiles')
        .select('id, first_name, last_name, current_company_id')
        .eq('tenant_id', permissions.tenantId || profile?.tenant_id)
        .eq('status', 'active')

    if (!permissions.isOwner && profile?.current_company_id) {
        usersQuery = usersQuery.eq('current_company_id', profile.current_company_id)
    }

    const { data: users } = isCEO ? await usersQuery : { data: [] }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Suspense fallback={<div>Loading Diary...</div>}>
                <DiaryClient
                    initialTemplates={templates}
                    initialEntries={initialEntries}
                    initialCompliance={compliance}
                    isCEO={isCEO}
                    currentUser={profile}
                    selectedDate={date}
                    allUsers={users}
                />
            </Suspense>
        </div>
    )
}
