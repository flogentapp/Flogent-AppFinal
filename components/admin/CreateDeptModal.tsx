'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createDepartment } from '@/lib/actions/admin' // Action we just added
import { Textarea } from '@/components/ui/Textarea'
import { Loader2 } from 'lucide-react'

interface CreateDeptModalProps {
    isOpen: boolean
    onClose: () => void
    departments: any[] // For parent selection
    companies: any[] // For company selection
}

export function CreateDeptModal({ isOpen, onClose, departments, companies }: CreateDeptModalProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createDepartment(formData)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Department">
            <form action={handleSubmit} className="space-y-4 pt-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                    <select
                        name="company_id"
                        required
                        className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    >
                        <option value="">-- Select Company --</option>
                        {companies.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Department Name</label>
                    <input
                        name="name"
                        required
                        className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                        placeholder="e.g. Finance"
                    />
                </div>

                <Textarea
                    name="description"
                    label="Description"
                    className="h-20"
                    placeholder="Optional description"
                />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Parent Department</label>
                    <select
                        name="parent_department_id"
                        className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                    >
                        <option value="">-- None (Top Level) --</option>
                        {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Department
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
