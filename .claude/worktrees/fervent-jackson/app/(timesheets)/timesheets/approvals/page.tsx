import { createClient } from '@/lib/supabase/server'
import { CheckCircle2 } from 'lucide-react'
import { ApprovalsTable } from '@/components/timesheets/ApprovalsTable'

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    // 1. Find projects where I am a "ProjectLeader"
    const { data: leadProjects } = await supabase
        .from('project_memberships')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'ProjectLeader')

    const projectIds = leadProjects?.map(p => p.project_id) || []

    // 2. Fetch "Submitted" entries for those projects
    let pendingEntries: any[] = []
    
    if (projectIds.length > 0) {
        const { data } = await supabase
            .from('time_entries')
            .select(`
                *,
                projects ( id, name, code, company_id ),
                profiles:user_id ( first_name, last_name, email )
            `)
            .in('project_id', projectIds)
            .eq('status', 'submitted')
            .order('entry_date', { ascending: false })
        
        pendingEntries = data || []
    }

    // 3. Fetch Context Data (Required for the 'View Details' modal to work)
    // We rely on RLS to only show projects/companies the user is allowed to see.
    const { data: projects } = await supabase.from('projects').select('*').order('name')
    const { data: companies } = await supabase.from('companies').select('id, name').order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
                    <p className="text-slate-500 text-sm">Review time entries submitted for your projects.</p>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                    {pendingEntries.length} Pending
                </div>
            </div>

            {pendingEntries.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-gray-900 font-bold">All caught up!</h3>
                    <p className="text-gray-500 text-sm mt-1">No pending approvals found for your projects.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Render Client Component */}
                    <ApprovalsTable 
                        entries={pendingEntries} 
                        projects={projects || []} 
                        companies={companies || []} 
                    />
                </div>
            )}
        </div>
    )
}