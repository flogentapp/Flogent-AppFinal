'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DeptListClient } from './DeptListClient' // Reusing the list
import { CreateDeptModal } from './CreateDeptModal'

export function DepartmentsClient({ departments, users, companies }: { departments: any[], users: any[], companies: any[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-gray-500 text-sm">Manage organization structure and leadership.</p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Department
                </button>
            </div>

            <DeptListClient departments={departments} users={users} />

            <CreateDeptModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                departments={departments}
                companies={companies}
            />
        </div>
    )
}
