'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleAppSubscription } from '@/lib/actions/admin'
import { Toaster, toast } from 'sonner'
import {
    Shield,
    Package,
    Lock,
    Clock,
    FileText,
    CheckSquare,
    LayoutDashboard,
    Grid,
    Loader2
} from 'lucide-react'

export default function AppSubscriptionsPage() {
    const [loading, setLoading] = useState(true)
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [isOwner, setIsOwner] = useState(false)
    const [toggling, setToggling] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user is tenant owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile) return

        const { data: tenant } = await supabase
            .from('tenants')
            .select('owner_user_id')
            .eq('id', profile.tenant_id)
            .single()

        const ownerStatus = tenant?.owner_user_id === user.id
        setIsOwner(ownerStatus)

        // Load subscriptions
        const { data } = await supabase
            .from('tenant_app_subscriptions')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('app_name')

        setSubscriptions(data || [])
        setLoading(false)
    }

    async function handleToggle(appName: string, currentlyEnabled: boolean) {
        if (!isOwner) return
        setToggling(appName)

        try {
            const result = await toggleAppSubscription(appName, !currentlyEnabled)
            if (result.success) {
                toast.success(`${!currentlyEnabled ? 'Enabled' : 'Disabled'} ${appName}`)
                loadData()
            } else {
                toast.error(result.error)
            }
        } catch (err) {
            toast.error('Failed to update subscription')
        } finally {
            setToggling(null)
        }
    }

    if (loading) return (
        <div className="p-8 text-center bg-gray-50 rounded-xl animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
        </div>
    )

    const allApps = [
        { key: 'timesheets', name: 'Timesheets', icon: Clock, description: 'Track time, submit for approval, and generate reports.' },
        { key: 'documents', name: 'Documents', icon: FileText, description: 'Manage project documents with version control.' },
        { key: 'tasks', name: 'Tasks', icon: CheckSquare, description: 'Create and track project tasks and workflows.' },
        { key: 'diary', name: 'Daily Diary', icon: LayoutDashboard, description: 'Site diaries and daily progress logs.' },
        { key: 'planner', name: 'Planner', icon: Package, description: 'Resource planning and scheduling.' }
    ]

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Grid className="w-8 h-8 text-indigo-600" />
                        App Subscriptions
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base mt-2 font-semibold italic">Enable or disable sub-apps for your organization. Manage your billing efficiently.</p>
                </div>

                {!isOwner && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-[24px] flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-amber-900">Restricted Access</h3>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">Only the Tenant Owner can manage app subscriptions. Contact your administrator if you need to enable a new module.</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    {allApps.map(app => {
                        const sub = subscriptions.find(s => s.app_name === app.key)
                        const enabled = sub?.enabled || false
                        const isProcessing = toggling === app.key
                        const Icon = app.icon

                        return (
                            <div key={app.key} className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md transition-all group">
                                <div className="flex items-start gap-6">
                                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 transition-colors ${enabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{app.name}</h3>
                                            <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                {enabled ? 'Active' : 'Missing'}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-md">{app.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center self-end sm:self-center">
                                    {isOwner ? (
                                        <button
                                            onClick={() => handleToggle(app.key, enabled)}
                                            disabled={isProcessing}
                                            className={`
                                                px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2
                                                ${enabled
                                                    ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                                                }
                                                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                                            `}
                                        >
                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (enabled ? 'Disable App' : 'Enable App')}
                                        </button>
                                    ) : (
                                        <div className="text-xs font-bold text-slate-400 italic flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Management Restricted
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-12 pt-12 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-400 font-bold mb-4 uppercase tracking-[0.2em]">Want to add a custom module?</p>
                    <button className="text-indigo-600 font-black text-sm hover:underline">Contact Flogent Enterprise Support</button>
                </div>
            </div>
        </div>
    )
}
