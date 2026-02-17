'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { assignUserToProject } from '@/lib/actions/admin'
import { Loader2 } from 'lucide-react'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
}

interface AssignProjectUserModalProps {
    projectId: string
    projectName: string
    users: User[]
    isOpen: boolean
    onClose: () => void
}

export function AssignProjectUserModal({ projectId, projectName, users, isOpen, onClose }: AssignProjectUserModalProps) {
    const [selectedUserId, setSelectedUserId] = useState('')
    const [role, setRole] = useState<'User' | 'ProjectLeader'>('User')
    const [loading, setLoading] = useState(false)

    const handleAssign = async () => {
        if (!selectedUserId) return
        setLoading(true)
        const result = await assignUserToProject(selectedUserId, projectId, role)
        setLoading(false)

        if (result.success) {
            onClose()
            setSelectedUserId('')
        } else {
            alert('Failed to assign: ' + result.error)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Member to ${projectName}`}>
            <div className="space-y-5 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 mb-4">
                    <strong>Project Leader:</strong> Can manage settings and approve time.<br />
                    <strong>Project Member:</strong> Can log time to the project.
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-2 ml-1">Select User</label>
                    <div className="relative">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 border-transparent appearance-none"
                        >
                            <option value="">-- Select a User --</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} ({user.email})
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-2 ml-1">Project Role</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole('User')}
                            className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${role === 'User' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                        >
                            Project Member
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ProjectLeader')}
                            className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${role === 'ProjectLeader' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                        >
                            Project Leader
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedUserId || loading}
                        className="px-8 shadow-xl shadow-indigo-100 rounded-xl"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {role === 'User' ? 'Add Member' : 'Assign Leader'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
