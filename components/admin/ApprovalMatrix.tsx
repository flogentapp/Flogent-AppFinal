'use client'

import { useState } from 'react'
import { Check, ShieldCheck, Loader2 } from 'lucide-react'
import { updateApprovalPolicy } from '@/lib/actions/admin'
import { Switch } from '@headlessui/react'

// 1. Defined Order: CEO at the top, User at the bottom
const ROW_ORDER = ['CEO', 'DepartmentHead', 'ProjectLeader', 'User']
const COL_ORDER = ['ProjectLeader', 'DepartmentHead', 'CEO', 'TenantOwner']

// Display Labels
const LABELS: Record<string, string> = {
    'User': 'User',
    'ProjectLeader': 'Project Leader',
    'DepartmentHead': 'Dept Head',
    'CEO': 'CEO',
    'TenantOwner': 'Tenant Owner'
}

export function ApprovalMatrix({ initialRules, initialEnabled }: { initialRules: any, initialEnabled: boolean }) {
    const [rules, setRules] = useState(initialRules)
    const [enabled, setEnabled] = useState(initialEnabled)
    const [saving, setSaving] = useState(false)

    const toggleRule = (submitter: string, approver: string) => {
        setRules((prev: any) => {
            const currentList = prev[submitter] || []
            const exists = currentList.includes(approver)
            
            let newList
            if (exists) {
                newList = currentList.filter((r: string) => r !== approver)
            } else {
                newList = [...currentList, approver]
            }

            return { ...prev, [submitter]: newList }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        await updateApprovalPolicy(rules, enabled)
        setSaving(false)
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Header / Toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Enable Timesheet Approvals</h3>
                        <p className="text-xs text-gray-500">If disabled, timesheets auto-approve on submission.</p>
                    </div>
                </div>
                
                <Switch
                    checked={enabled}
                    onChange={setEnabled}
                    className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                    <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                </Switch>
            </div>

            {/* Matrix */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 px-1">Approval Matrix</h3>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submitter Role</th>
                                {COL_ORDER.map(col => (
                                    <th key={col} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {LABELS[col]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {ROW_ORDER.map((rowRole) => (
                                <tr key={rowRole} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap bg-gray-50/30">
                                        <span className="text-sm font-bold text-gray-900">{LABELS[rowRole]}</span>
                                    </td>
                                    {COL_ORDER.map((colRole) => {
                                        const isChecked = (rules[rowRole] || []).includes(colRole)
                                        return (
                                            <td key={colRole} className="px-6 py-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRule(rowRole, colRole)}
                                                    className={`w-6 h-6 inline-flex items-center justify-center rounded border transition-all duration-200 ${
                                                        isChecked 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                                        : 'bg-white border-gray-300 text-transparent hover:border-indigo-300'
                                                    }`}
                                                >
                                                    <Check className="w-4 h-4" strokeWidth={3} />
                                                </button>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
                    <span className="font-bold text-blue-700">Note:</span> 
                    Approvers must also have relevant scope (e.g., Project Leader must lead the specific project).
                </p>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-2">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-70 flex items-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    )
}