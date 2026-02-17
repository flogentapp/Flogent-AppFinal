import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlannerClient } from '@/components/planner/PlannerClient'
import { getPlannerTasks } from '@/lib/actions/planner'
import { getUserPermissions } from '@/lib/actions/permissions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PlannerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const admin = createAdminClient()
    const permissions = await getUserPermissions()

    // 1. Get Profile via Admin
    const { data: profile } = await admin
        .from('profiles')
        .select('tenant_id, current_company_id, current_department_id')
        .eq('id', user.id)
        .single()

    // --- ENHANCED TENANT RESOLUTION (Matches Header Logic) ---
    const activeTenantId = profile?.tenant_id || user.user_metadata?.tenant_id
    const activeCompanyId = profile?.current_company_id || user.user_metadata?.current_company_id

    if (!activeTenantId) {
        return (
            <div className="p-20 text-center space-y-4">
                <h1 className="text-2xl font-black text-slate-900">Workspace Data Not Found</h1>
                <p className="text-slate-500">The system couldn't resolve your tenant ID from your profile or metadata.</p>
                <div className="text-[10px] font-mono bg-slate-50 p-4 rounded-lg">User ID: {user.id}</div>
            </div>
        )
    }

    // 2. Fetch Data in Parallel via Admin
    const [
        tasks,
        { data: projects },
        { data: users }
    ] = await Promise.all([
        getPlannerTasks(),
        admin
            .from('projects')
            .select('id, name, code, status, company_id')
            .eq('tenant_id', activeTenantId)
            .eq('status', 'active')
            .order('name'),
        admin
            .from('profiles')
            .select('id, email, first_name, last_name, status')
            .eq('tenant_id', activeTenantId)
            .eq('status', 'active')
            .order('first_name')
    ])

    // Filter projects by company if one is active
    const filteredProjects = activeCompanyId
        ? projects?.filter(p => p.company_id === activeCompanyId)
        : projects

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <PlannerClient
                        tasks={tasks || []}
                        projects={filteredProjects || []}
                        users={users || []}
                        currentUser={user}
                    />
                </div>
            </div>
        </div>
    )
}
