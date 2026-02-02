'use client'

import { useState } from 'react'
import { Building2, Plus, UserPlus } from 'lucide-react'
import { AssignCeoModal } from './AssignCeoModal'
// We will still use the server action for creation via the simple form, 
// OR we could move creation here too. For now, we just augment the list.

interface Company {
    id: string
    name: string
    code: string | null
    status: string
}

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
}

interface CompaniesClientProps {
    companies: Company[]
    users: User[]
    createAction: (formData: FormData) => Promise<void> // Passed from server
}

export function CompaniesClient({ companies, users, createAction }: CompaniesClientProps) {
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500 text-sm">Manage legal entities within your organization.</p>
                </div>
            </div>

            {/* Create Company Quick Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Company</h3>
                <form action={createAction} className="flex gap-4 items-end">
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
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50/50 transition-colors group">
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => setSelectedCompany(company)}
                                        className="hidden group-hover:flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Assign CEO
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {companies.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No companies found.</div>
                )}
            </div>

            {selectedCompany && (
                <AssignCeoModal
                    isOpen={!!selectedCompany}
                    onClose={() => setSelectedCompany(null)}
                    companyId={selectedCompany.id}
                    companyName={selectedCompany.name}
                    users={users}
                />
            )}
        </div>
    )
}
