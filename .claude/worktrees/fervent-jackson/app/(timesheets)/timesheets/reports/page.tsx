import { createClient } from '@/lib/supabase/server'
import { BarChart3, PieChart, TrendingUp, Users } from 'lucide-react'
import { ReportsFilters } from '@/components/timesheets/ReportsFilters'

export default async function ReportsPage({
    searchParams
}: {
    searchParams: Promise<{ company?: string, department?: string, project?: string, user?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Please log in</div>

    // 1. Fetch Tenant Context
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id
    if (!tenantId) return <div>No company context found</div>

    // 2. Fetch Filter Options (Lists for the dropdowns)
    const { data: companies } = await supabase.from('companies').select('id, name').eq('tenant_id', tenantId).order('name')
    const { data: departments } = await supabase.from('departments').select('id, name').eq('tenant_id', tenantId).order('name')
    const { data: projects } = await supabase.from('projects').select('id, name').eq('tenant_id', tenantId).eq('status', 'active').order('name')
    
    // For users, we get everyone in the tenant
    const { data: users } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('tenant_id', tenantId)
        .order('first_name')


    // 3. Build the Query with Filters
    let query = supabase
        .from('time_entries')
        .select(`
            hours,
            status,
            projects!inner ( id, name, department_id, company_id ),
            profiles!inner ( id, first_name, last_name ),
            tenant_id
        `)
        .eq('tenant_id', tenantId)

    // Apply URL Filters (tenant_id is already set above — never overwrite it from URL params)
    if (params.company) query = query.eq('projects.company_id', params.company)
    if (params.project) query = query.eq('project_id', params.project)
    if (params.user) query = query.eq('user_id', params.user)
    
    // Department filter is trickier (it lives on the project or user, not the entry directly usually)
    // Here we assume projects have a department_id, so we filter the joined project table
    if (params.department) query = query.eq('projects.department_id', params.department)

    const { data: entries } = await query

    // 4. Aggregation Logic
    const totalHours = entries?.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0) || 0
    const pendingHours = entries?.filter(e => e.status === 'submitted').reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0) || 0
    
    // Group by Project
    const projectStats: Record<string, number> = {}
    entries?.forEach(e => {
        const project = Array.isArray(e.projects) ? e.projects[0] : e.projects
        const name = project?.name || 'Unknown'
        projectStats[name] = (projectStats[name] || 0) + Number(e.hours)
    })

    // Group by User
    const userStats: Record<string, number> = {}
    entries?.forEach(e => {
        const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
        const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'
        userStats[name] = (userStats[name] || 0) + Number(e.hours)
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-slate-500 text-sm">Overview of time usage across the organization.</p>
                </div>
            </div>

            {/* FILTERS COMPONENT */}
            <ReportsFilters 
                companies={companies || []}
                departments={departments || []}
                projects={projects || []}
                users={users || []}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Hours</p>
                            <p className="text-2xl font-black text-gray-900">{totalHours.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Approval</p>
                            <p className="text-2xl font-black text-gray-900">{pendingHours.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Users</p>
                            <p className="text-2xl font-black text-gray-900">{Object.keys(userStats).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Project Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Hours by Project</h3>
                    {Object.keys(projectStats).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No data matches your filters.</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(projectStats)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([name, hours]) => (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{name}</span>
                                            <span className="font-bold text-gray-900">{hours.toFixed(1)}h</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${(hours / totalHours) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* User Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top Contributors</h3>
                    {Object.keys(userStats).length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No data matches your filters.</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(userStats)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([name, hours]) => (
                                    <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{name}</span>
                                        </div>
                                        <span className="text-sm font-black text-indigo-600">{hours.toFixed(1)}h</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}