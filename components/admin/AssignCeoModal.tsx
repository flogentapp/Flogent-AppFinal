'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { assignCompanyCeo } from '@/lib/actions/admin'
import { Loader2 } from 'lucide-react'

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
}

interface AssignCeoModalProps {
    companyId: string
    companyName: string
    users: User[]
    isOpen: boolean
    onClose: () => void
}

export function AssignCeoModal({ companyId, companyName, users, isOpen, onClose }: AssignCeoModalProps) {
    const [selectedUserId, setSelectedUserId] = useState('')
    const [loading, setLoading] = useState(false)

    const handleAssign = async () => {
        if (!selectedUserId) return
        setLoading(true)
        const result = await assignCompanyCeo(companyId, selectedUserId)
        setLoading(false)

        if (result.success) {
            onClose()
            setSelectedUserId('')
        } else {
            alert('Failed to assign: ' + result.error)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign CEO to ${companyName}`}>
            <div className="space-y-5 pt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
                    <strong>Note:</strong> A CEO has full access to all projects and departments within this company.
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Select User</label>
                    <div className="relative">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm p-3 appearance-none bg-white"
                        >
                            <option value="">-- Select a User --</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name} ({user.email})
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedUserId || loading}
                        className="flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Assign CEO
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
