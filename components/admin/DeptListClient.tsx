'use client'

import { useState } from 'react'
import { AssignDeptHeadModal } from '@/components/admin/AssignDeptHeadModal'
import { UserPlus, Building, ChevronRight } from 'lucide-react'

export function DeptListClient({ departments, users }: { departments: any[], users: any[] }) {
    const [selectedDept, setSelectedDept] = useState<any>(null)

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
                {departments.map((dept) => (
                    <li key={dept.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${dept.parent_department_id ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    {dept.name}
                                    {dept.parent_department_id && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-wide">Sub</span>}
                                </h3>
                                {/* Show current head if you have that data, otherwise just description */}
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {dept.description || 'No description provided'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedDept(dept)}
                                className="hidden group-hover:flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all animate-in fade-in duration-200"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Assign Head
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                    </li>
                ))}
                
                {departments.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No departments found.
                    </div>
                )}
            </ul>

            {/* The Modal */}
            {selectedDept && (
                <AssignDeptHeadModal
                    isOpen={!!selectedDept}
                    onClose={() => setSelectedDept(null)}
                    departmentId={selectedDept.id}
                    departmentName={selectedDept.name}
                    users={users}
                />
            )}
        </div>
    )
}