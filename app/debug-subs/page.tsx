import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function DebugSubs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Not logged in</div>

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    const { data: subs } = await admin.from('tenant_app_subscriptions').select('*').eq('tenant_id', tenantId)

    return (
        <div className="p-10 space-y-4">
            <h1 className="text-2xl font-bold">Tenant Subscriptions Debug</h1>
            <p>Tenant ID: {tenantId}</p>
            <pre className="bg-slate-100 p-4 rounded-xl">
                {JSON.stringify(subs, null, 2)}
            </pre>
            <div className="mt-8">
                <h2 className="text-xl font-bold">App Metadata Check</h2>
                <p>The app currently looks for "task_planner". If it's missing or disabled, it will redirect back to home.</p>
            </div>
        </div>
    )
}
