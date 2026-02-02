'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleAppSubscription } from '@/lib/actions/admin'
import { Toaster, toast } from 'sonner'
import { Shield, Package, Lock } from 'lucide-react'

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
        { key: 'timesheets', name: 'Timesheets', description: 'Track time, submit for approval, and generate reports.' },
        { key: 'documents', name: 'Documents', description: 'Manage project documents with version control.' },
        { key: 'tasks', name: 'Tasks', description: 'Create and track project tasks and workflows.' },
        { key: 'diary', name: 'Daily Diary', description: 'Site diaries and daily progress logs.' },
        { key: 'planner', name: 'Planner', description: 'Resource planning and scheduling.' }
    ]

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6 text-indigo-600" />
                    App Subscriptions
                </h1>
                <p className="text-gray-500 text-sm mt-1">Enable or disable sub-apps for your organization. Only the Tenant Owner can manage this.</p>
            </div>

            {!isOwner && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-yellow-800">Restricted Access</h3>
                        <p className="text-sm text-yellow-700">Only the Tenant Owner can manage app subscriptions. You can view the status but cannot make changes.</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {allApps.map(app => {
                    const sub = subscriptions.find(s => s.app_name === app.key)
                    const enabled = sub?.enabled || false
                    const isProcessing = toggling === app.key

                    return (
                        <div key={app.key} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{app.name}</h3>
                                <p className="text-sm text-gray-500">{app.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {enabled ? 'Active' : 'Inactive'}
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => handleToggle(app.key, enabled)}
                                        disabled={isProcessing}
                                        className={`
                            px-4 py-2 rounded-lg font-bold text-sm transition-all
                            ${enabled
                                                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                                            }
                            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                                    >
                                        {isProcessing ? 'Saving...' : (enabled ? 'Disable' : 'Enable')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
