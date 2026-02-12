import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Clock,
    FileText,
    CheckSquare,
    Calendar,
    Shield,
    ArrowRight,
    Check,
    Grid,
    LayoutDashboard,
    Building2,
    Users2
} from 'lucide-react'

export default async function HubPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const adminClient = createAdminClient()

    // 1. Fetch Stats
    const { data: profile } = await adminClient
        .from('profiles')
        .select('tenant_id, first_name, current_company_id, current_department_id, current_project_id')
        .eq('id', user.id)
        .single()

    const activeTenantId = profile?.tenant_id || user.user_metadata?.tenant_id
    if (!activeTenantId) redirect('/onboarding')

    // Get this week's hours
    const today = new Date()
    const startOfWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)) // Monday

    const { data: weekEntries } = await supabase
        .from('time_entries')
        .select('hours, minutes')
        .eq('user_id', user.id)
        .gte('entry_date', startOfWeekDate.toISOString().split('T')[0])

    const totalHours = weekEntries?.reduce((acc, curr) => acc + Number(curr.hours) + (Number(curr.minutes) / 60), 0) || 0

    const firstName = profile?.first_name || user.user_metadata?.first_name || 'Guest'

    // 2. Fetch Enabled Apps
    const { data: subs } = await adminClient
        .from('tenant_app_subscriptions')
        .select('app_name')
        .eq('tenant_id', activeTenantId)
        .eq('enabled', true)

    const enabledApps = subs?.map(s => s.app_name) || []

    const appMetadata = [
        {
            id: 'timesheets',
            name: 'Timesheets',
            description: 'Track precise working hours, manage project allocations, and handle weekly approvals.',
            icon: Clock,
            href: '/timesheets/my',
            active: enabledApps.includes('timesheets'),
            color: 'from-indigo-600 to-violet-700',
            iconColor: 'bg-white/20 text-white'
        },
        {
            id: 'documents',
            name: 'Documents',
            description: 'Centralized cloud storage for company policies, contracts, and project documentation.',
            icon: FileText,
            href: '#',
            active: enabledApps.includes('documents'),
            color: 'from-slate-800 to-slate-900',
            iconColor: 'bg-slate-700 text-slate-300'
        },
        {
            id: 'tasks',
            name: 'Task Manager',
            description: 'Intelligent task tracking with priority management and team collaboration boards.',
            icon: CheckSquare,
            href: '#',
            active: enabledApps.includes('tasks'),
            color: 'from-indigo-500 to-indigo-600',
            iconColor: 'bg-indigo-400/30 text-indigo-100'
        }
    ]

    return (
        <div className="p-4 sm:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* WELCOME SECTION */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        Hello, {firstName}
                    </h1>
                    <p className="text-slate-500 mt-3 font-semibold text-sm sm:text-lg">Welcome to your workstation. Select an application to continue.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-[24px] border border-slate-100 shadow-sm w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none px-6 py-2 text-center text-nowrap">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tracked This Week</div>
                        <div className="text-2xl font-black text-indigo-600">{totalHours.toFixed(1)}h</div>
                    </div>
                </div>
            </div>

            {/* APPS GRID */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Grid className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-sm">Your Applications</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {appMetadata.map((app) => (
                        <div
                            key={app.id}
                            className={`relative group h-full`}
                        >
                            {!app.active && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 rounded-[40px] flex items-center justify-center animate-in fade-in">
                                    <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                                        <Shield className="w-3 h-3" /> Locked
                                    </div>
                                </div>
                            )}

                            <div className={`
                                h-full flex flex-col p-10 rounded-[40px] shadow-sm transition-all duration-300
                                ${app.active
                                    ? `bg-gradient-to-br ${app.color} text-white hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1`
                                    : 'bg-white border border-slate-100 grayscale opacity-40'}
                            `}>
                                <div className={`w-14 h-14 ${app.iconColor} rounded-[20px] flex items-center justify-center mb-10`}>
                                    <app.icon className="w-7 h-7" />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-black mb-3">{app.name}</h3>
                                    <p className={`text-sm font-medium leading-relaxed opacity-70 mb-10`}>
                                        {app.description}
                                    </p>
                                </div>

                                {app.active ? (
                                    <Link
                                        href={app.href}
                                        className="inline-flex items-center justify-between bg-white text-indigo-900 px-6 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest group-hover:scale-105 transition-all"
                                    >
                                        <span>Open Application</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                ) : (
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-auto pt-10 border-t border-slate-100">
                                        Subscription Required
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* QUICK ACCESS / SETTINGS */}
            <div className="pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link
                    href="/admin/companies"
                    className="flex items-center gap-6 p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group"
                >
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-black text-slate-900">Organization Settings</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Manage companies & structure</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                    href="/admin/users"
                    className="flex items-center gap-6 p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group"
                >
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Users2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-black text-slate-900">Team Management</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Users, roles and permissions</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>
        </div>
    )
}
