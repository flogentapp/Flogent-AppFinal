import { createClient } from '@/lib/supabase/server'
import { getWeekStart, formatDate } from '@/lib/utils/dateHelpers'
import { WeekNavigation } from '@/components/timesheets/WeekNavigation'
import { WeekView } from '@/components/timesheets/WeekView'
import { TimesheetTable } from '@/components/timesheets/TimesheetTable'

export default async function MyTimesheetsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string, from?: string, to?: string, project?: string, status?: string }>
}) {
    const params = await searchParams
    const dateParam = params.date
    const mode = (params.from && params.to) ? 'range' : 'week'
    const currentDate = dateParam ? new Date(dateParam) : new Date()
    const from = mode === 'range' ? params.from! : formatDate(getWeekStart(currentDate))
    const to = mode === 'range' ? params.to! : formatDate(new Date(getWeekStart(currentDate).setDate(getWeekStart(currentDate).getDate() + 6)))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    // 1. Fetch Profile (Default Company)
    const { data: profile } = await supabase.from('profiles').select('current_company_id, tenant_id').eq('id', user.id).single()
    const currentCompanyId = profile?.current_company_id

    // 2. Fetch user's assigned projects via memberships
    const { data: membershipData } = await supabase
        .from('project_memberships')
        .select(`
            project_id,
            projects (
                id,
                name,
                code,
                status,
                company_id
            )
        `)
        .eq('user_id', user.id)

    const projects = membershipData
        ?.filter((m: any) => m.projects)
        .map((m: any) => ({
            ...m.projects,
            company_id: m.projects.company_id
        }))
        .filter((p: any) => p && p.status === 'active')
        .sort((a: any, b: any) => a.name.localeCompare(b.name)) || []

    // 3. Derive companies from user's project memberships (only companies with assigned projects)
    const userCompanyIds = [...new Set(projects.map((p: any) => p.company_id).filter(Boolean))]
    let companies: any[] = []
    if (userCompanyIds.length > 0) {
        const { data } = await supabase
            .from('companies')
            .select('id, name')
            .in('id', userCompanyIds)
            .eq('status', 'active')
            .order('name')
        companies = data || []
    }

    // 4. Fetch departments for user's projects (for disambiguation via project_departments junction)
    const projectIds = projects.map((p: any) => p.id)
    let departments: any[] = []
    let projectDeptMap: Record<string, string> = {}
    if (projectIds.length > 0) {
        const { data: projDepts } = await supabase
            .from('project_departments')
            .select('project_id, department_id')
            .in('project_id', projectIds)

        if (projDepts && projDepts.length > 0) {
            // Build project → department mapping
            for (const pd of projDepts) {
                projectDeptMap[pd.project_id] = pd.department_id
            }
            const deptIds = [...new Set(projDepts.map(pd => pd.department_id))]
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .in('id', deptIds)
            departments = data || []
        }
    }

    // Enrich projects with department_id from junction table
    const enrichedProjects = projects.map((p: any) => ({
        ...p,
        department_id: projectDeptMap[p.id] || null
    }))

    // 5. Fetch Entries
    let query = supabase
        .from('time_entries')
        .select(`*, projects ( name, code )`)
        .eq('user_id', user.id)
        .gte('entry_date', from)
        .lte('entry_date', to)

    if (params.project) query = query.eq('project_id', params.project)
    if (params.status) query = query.eq('status', params.status)

    const { data: rawEntries } = await query
    const entries = rawEntries?.map(e => ({ ...e, project_name: e.projects?.name })) || []

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Timesheet</h1>
                {mode === 'week' && <WeekNavigation currentDate={new Date(from)} />}
            </div>

            {mode === 'week' ? (
                <div className="w-full overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
                    <div className="min-w-[800px]"> 
                        <WeekView
                            startDate={new Date(from)}
                            entries={entries}
                            projects={enrichedProjects}
                            companies={companies}
                            departments={departments}
                            defaultCompanyId={currentCompanyId}
                        />
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                    <div className="overflow-x-auto">
                        <TimesheetTable entries={entries} />
                    </div>
                </div>
            )}
        </div>
    )
}