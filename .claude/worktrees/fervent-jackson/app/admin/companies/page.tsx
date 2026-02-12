import { createClient } from '@/lib/supabase/server'
import { Building2, Plus, ArrowRight, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal' // Assuming we have this, or build new one
// Note: Using standard page for simplicity, can add actions inline

// SERVER ACTION for creating company
async function createCompany(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const code = formData.get('code') as string

    if (!name) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return

    await supabase.from('companies').insert({
        tenant_id: profile.tenant_id,
        name,
        code: code || null,
        status: 'active'
    })
}

export default async function CompaniesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    // Fetch tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    let companies: any[] = []
    if (tenantId) {
        const { data } = await supabase
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name')
        companies = data || []
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500 text-sm">Manage legal entities within your organization.</p>
                </div>
                {/* Simple create form inline for now, or modal trigger */}
            </div>

            {/* Create Company Quick Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Company</h3>
                <form action={createCompany} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Company Name</label>
                        <input name="name" required className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="e.g. Acme Logistics" />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Code</label>
                        <input name="code" className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="ACM-LOG" />
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create
                    </button>
                </form>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{company.name}</div>
                                            <div className="text-xs text-gray-400">ID: {company.id.slice(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {company.code || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700 uppercase tracking-wide">
                                        {company.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {companies.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No companies found.</div>
                )}
            </div>
        </div>
    )
}
