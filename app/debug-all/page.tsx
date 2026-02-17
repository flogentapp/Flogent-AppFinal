import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function DebugAll() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="p-10 text-red-600 font-bold">Not logged in. Go to /login</div>

    const admin = createAdminClient()
    const permissions = await getUserPermissions()

    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
    const { data: tenant } = await admin.from('tenants').select('*').eq('id', profile?.tenant_id).single()
    const { data: subs } = await admin.from('tenant_app_subscriptions').select('*').eq('tenant_id', profile?.tenant_id)

    return (
        <div className="p-10 space-y-8 bg-white min-h-screen text-slate-900">
            <h1 className="text-4xl font-black">System Diagnostic</h1>

            <section>
                <h2 className="text-xl font-bold mb-2">User & Profile</h2>
                <pre className="p-4 bg-slate-50 rounded-xl overflow-auto text-xs">
                    {JSON.stringify({ user: { id: user.id, email: user.email }, profile }, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-2">Tenant & Owner Status</h2>
                <p className="mb-2">Owner ID: <span className="font-mono">{tenant?.owner_user_id}</span></p>
                <p>Is Current User Owner? <span className={tenant?.owner_user_id === user.id ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {tenant?.owner_user_id === user.id ? 'YES' : 'NO'}
                </span></p>
                <pre className="p-4 bg-slate-50 rounded-xl overflow-auto text-xs mt-2">
                    {JSON.stringify(tenant, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-2">Enabled Apps</h2>
                <div className="flex gap-2">
                    {subs?.map(s => (
                        <div key={s.app_name} className={`px-3 py-1 rounded-full text-xs font-bold ${s.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {s.app_name} {s.enabled ? 'ENABLED' : 'DISABLED'}
                        </div>
                    ))}
                </div>
                <pre className="p-4 bg-slate-50 rounded-xl overflow-auto text-xs mt-2">
                    {JSON.stringify(subs, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-2">Permissions Object</h2>
                <pre className="p-4 bg-slate-50 rounded-xl overflow-auto text-xs">
                    {JSON.stringify(permissions, null, 2)}
                </pre>
            </section>
        </div>
    )
}
