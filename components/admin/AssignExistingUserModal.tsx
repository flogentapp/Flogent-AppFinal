'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { assignUserToCompany } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

export function AssignExistingUserModal({
    isOpen,
    onClose,
    allUsers,
    currentUsers,
    currentCompanyId,
    onAssigned
}: {
    isOpen: boolean
    onClose: () => void
    allUsers: any[]
    currentUsers: any[]
    currentCompanyId: string
    onAssigned: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    const currentIds = new Set(currentUsers.map(u => u.id))
    const availableUsers = allUsers.filter(u => !currentIds.has(u.id))

    const filtered = availableUsers.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
    )

    const handleAssign = async (userId: string) => {
        if (!mounted) return
        setLoading(true)
        const res = await assignUserToCompany(userId, currentCompanyId)
        if (!mounted) return
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('User added to company')
            onAssigned()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Existing User to Company">
            <div className="space-y-4 pt-2">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search all team members..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto border rounded-xl divide-y">
                    {filtered.length > 0 ? (
                        filtered.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{u.first_name} {u.last_name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleAssign(u.id)}
                                    disabled={loading}
                                >
                                    Add
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-sm text-gray-500">
                            {search ? 'No users found matching your search.' : 'All users in your tenant are already in this company.'}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    )
}
