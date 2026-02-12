import { createClient } from '@/lib/supabase/server'
import { TimesheetFilters } from '@/components/timesheets/TimesheetFilters'
import { TimesheetTable } from '@/components/timesheets/TimesheetTable'

export default async function DepartmentReportPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<any>
}) {
    const { id } = await params
    const qParams = await searchParams

    // Default to this month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const from = qParams.from || firstDay.toISOString().split('T')[0]
    const to = qParams.to || lastDay.toISOString().split('T')[0]

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    // Fetch Department
    const { data: dept } = await supabase.from('departments').select('name').eq('id', id).single()

    // Query entries
    // Filter by projects belonging to this department? 
    // Or users belonging to this department?
    // Project-Department link is N:N (project_departments).
    // Simple approach: Find all projects linked to this dept, then find entries for those projects.

    // 1. Get Project IDs for this Dept
    const { data: projDepts } = await supabase.from('project_departments').select('project_id').eq('department_id', id)
    const projectIds = projDepts?.map(pd => pd.project_id) || []

    let query = supabase
        .from('time_entries')
        .select(`
            *,
            projects ( name ),
            profiles ( first_name, last_name )
        `)
        .in('project_id', projectIds) // Filter by projects in this dept
        .gte('entry_date', from)
        .lte('entry_date', to)

    if (qParams.project) query = query.eq('project_id', qParams.project)
    if (qParams.user) query = query.eq('user_id', qParams.user)
    if (qParams.status) query = query.eq('status', qParams.status)

    const { data: rawEntries } = await query

    const entries = rawEntries?.map(e => ({
        ...e,
        user_name: e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name || ''}` : 'Unknown',
        project_name: e.projects?.name
    })) || []

    // Fetch projects for filter
    const { data: projects } = await supabase.from('projects').select('id, name').in('id', projectIds)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Department Report: {dept?.name}</h1>
                    <p className="text-gray-500 text-sm">Time entries for projects linked to this department.</p>
                </div>
            </div>

            <TimesheetFilters projects={projects || []} />

            <TimesheetTable entries={entries} />
        </div>
    )
}
