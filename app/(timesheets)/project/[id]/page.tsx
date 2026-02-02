import { createClient } from '@/lib/supabase/server'
import { TimesheetFilters } from '@/components/timesheets/TimesheetFilters'
import { TimesheetTable } from '@/components/timesheets/TimesheetTable'

export default async function ProjectReportPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<any>
}) {
    const { id } = await params
    const qParams = await searchParams

    // Default to this month if no range
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const from = qParams.from || firstDay.toISOString().split('T')[0]
    const to = qParams.to || lastDay.toISOString().split('T')[0]

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    // Fetch Project Details
    const { data: project } = await supabase.from('projects').select('name, code').eq('id', id).single()

    // Fetch Entries for Project
    // Requires permissions (RLS)
    let query = supabase
        .from('time_entries')
        .select(`
            *,
            profiles ( first_name, last_name )
        `)
        .eq('project_id', id)
        .gte('entry_date', from)
        .lte('entry_date', to)

    if (qParams.user) query = query.eq('user_id', qParams.user)
    if (qParams.status) query = query.eq('status', qParams.status)

    const { data: rawEntries, error } = await query

    const entries = rawEntries?.map(e => ({
        ...e,
        user_name: e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name || ''}` : 'Unknown',
        project_name: project?.name
    })) || []

    // Fetch Users for Filter (Members of this project?)
    // This allows filtering by specific user on this report
    // Maybe just all company users for simplicity in Phase 1
    const { data: users } = await supabase.from('profiles').select('id, first_name, last_name').eq('tenant_id', user.user_metadata.tenant_id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Report: {project?.name}</h1>
                    <p className="text-gray-500 text-sm">{project?.code}</p>
                </div>
            </div>

            <TimesheetFilters users={users || []} />

            <TimesheetTable entries={entries} />
        </div>
    )
}
