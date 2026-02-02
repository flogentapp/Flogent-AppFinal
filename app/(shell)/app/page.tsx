import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, FileText, CheckSquare, BookOpen, Calendar, Shield, ArrowRight } from 'lucide-react'

export default async function HubPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get user's tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, first_name')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // If user exists but has no profile (e.g. after DB reset),
        // we must clear the stale tenant_id from metadata to stop the middleware loop
        if (user.user_metadata?.tenant_id) {
            await supabase.auth.updateUser({
                data: { tenant_id: null }
            })
        }
        redirect('/onboarding')
    }

    // Get enabled apps for this tenant
    const { data: subscriptions } = await supabase
        .from('tenant_app_subscriptions')
        .select('app_name, enabled')
        .eq('tenant_id', profile.tenant_id)
        .eq('enabled', true)

    const enabledApps = new Set(subscriptions?.map(s => s.app_name) || [])

    // Define all possible apps
    const allApps = [
        {
            name: 'timesheets',
            title: 'Timesheets',
            description: 'Track time, manage approvals, generate reports',
            icon: <Clock className="w-6 h-6" />,
            bigIcon: <Clock className="w-24 h-24 text-indigo-600" />,
            href: '/timesheets/my',
            color: 'bg-blue-500'
        },
        {
            name: 'documents',
            title: 'Documents',
            description: 'Manage project documents, version control',
            icon: <FileText className="w-6 h-6" />,
            bigIcon: <FileText className="w-24 h-24 text-green-600" />,
            href: '/documents',
            color: 'bg-green-500'
        },
        {
            name: 'tasks',
            title: 'Tasks',
            description: 'Task management, workflows, assignments',
            icon: <CheckSquare className="w-6 h-6" />,
            bigIcon: <CheckSquare className="w-24 h-24 text-purple-600" />,
            href: '/tasks',
            color: 'bg-purple-500'
        },
        {
            name: 'diary',
            title: 'Daily Diary',
            description: 'Site diaries, daily logs, progress tracking',
            icon: <BookOpen className="w-6 h-6" />,
            bigIcon: <BookOpen className="w-24 h-24 text-orange-600" />,
            href: '/diary',
            color: 'bg-orange-500'
        },
        {
            name: 'planner',
            title: 'Planner',
            description: 'Resource planning, scheduling, capacity',
            icon: <Calendar className="w-6 h-6" />,
            bigIcon: <Calendar className="w-24 h-24 text-red-600" />,
            href: '/planner',
            color: 'bg-red-500'
        }
    ]

    // Filter to only enabled apps
    const availableApps = allApps.filter(app => enabledApps.has(app.name))

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {(await searchParams).error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                    <p className="text-red-800 font-medium flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {(await searchParams).error === 'app_not_enabled'
                            ? 'This app is not enabled for your organization. Contact your administrator.'
                            : 'Access Denied'}
                    </p>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Welcome back, {profile.first_name || 'there'}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Select an app to get started</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Administration - Always available */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Core</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            <Link href="/admin/companies" className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Shield className="w-24 h-24 text-indigo-600" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Administration</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Manage companies, departments, users, and app subscriptions.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm gap-2 group-hover:translate-x-1 transition-transform">
                                        Manage Settings <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Available Apps */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Apps</h2>
                        {availableApps.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableApps.map(app => (
                                    <Link key={app.name} href={app.href} className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            {app.bigIcon}
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div>
                                                <div className={`w-12 h-12 ${app.name === 'timesheets' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                                    {app.icon}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">{app.title}</h3>
                                                <p className="text-slate-500 text-sm leading-relaxed">
                                                    {app.description}
                                                </p>
                                            </div>
                                            <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm gap-2 group-hover:translate-x-1 transition-transform">
                                                Launch App <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                <p className="text-yellow-800 font-medium">
                                    No apps are currently enabled for your organization.
                                    <br />
                                    <span className="text-sm font-normal">Contact your administrator to enable apps in the Admin section.</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Context Section */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Shield className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need access?</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Apps must be enabled by your Tenant Administrator in the Admin console.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}