
'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Shield, Trash2, Loader2, Plus, Building2, UserCircle } from 'lucide-react'
import { assignUserRole, removeUserRole } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function UserRoleModal({ isOpen, onClose, user, currentCompanyId, roles = [], onUpdated }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const handleAssign = async (role: string) => {
        setIsSubmitting(true)
        const res = await assignUserRole(user.id, role as any, 'company', currentCompanyId)
        setIsSubmitting(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Assigned ${role} role to ${user.first_name}`)
            onUpdated?.()
        }
    }

    const handleRemove = async (assignmentId: string) => {
        setRemovingId(assignmentId)
        const res = await removeUserRole(assignmentId)
        setRemovingId(null)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Role removed')
            onUpdated?.()
        }
    }

    const availableRoles = ['CEO', 'Admin', 'User']
    const userRoleNames = roles.map((r: any) => r.role)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Roles: ${user?.first_name} ${user?.last_name}`}>
            <div className="space-y-8 py-2">
                {/* Current Roles */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Active Organizational Roles</label>
                    <div className="space-y-2">
                        {roles.length > 0 ? roles.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 leading-none">{r.role}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Company Scope</div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(r.id)}
                                    disabled={removingId === r.id}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                    {removingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                            </div>
                        )) : (
                            <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <UserCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-400 italic">No organizational roles assigned yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Assign New */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Assign New Priority Role</label>
                    <div className="grid grid-cols-1 gap-3">
                        {availableRoles.filter(role => !userRoleNames.includes(role)).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleAssign(role)}
                                disabled={isSubmitting}
                                className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-400">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 tracking-tight">{role}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-indigo-400">Grant full access as {role}</div>
                                    </div>
                                </div>
                                <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Shield className="w-5 h-5" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <Button variant="ghost" className="w-full rounded-2xl font-black uppercase tracking-wider text-xs" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
