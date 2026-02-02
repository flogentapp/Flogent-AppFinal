'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Filter, X } from 'lucide-react'

export function TimesheetFilters({
    projects,
    users,
    departments
}: {
    projects?: any[],
    users?: any[],
    departments?: any[]
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initial State from URL
    const [filters, setFilters] = useState({
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || '',
        project: searchParams.get('project') || '',
        department: searchParams.get('department') || '',
        user: searchParams.get('user') || '',
        status: searchParams.get('status') || '',
    })

    const handleChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const applyFilters = () => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value)
        })
        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        setFilters({
            from: '', to: '', project: '', department: '', user: '', status: ''
        })
        router.push('?')
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap gap-3 items-end">
                
                {/* Dates */}
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">From</label>
                    <input type="date" value={filters.from} onChange={e => handleChange('from', e.target.value)} className="block w-full rounded-lg border-gray-200 text-xs py-2 px-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">To</label>
                    <input type="date" value={filters.to} onChange={e => handleChange('to', e.target.value)} className="block w-full rounded-lg border-gray-200 text-xs py-2 px-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                {/* Projects */}
                {projects && (
                    <div className="col-span-2 md:col-span-1 lg:min-w-[160px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Project</label>
                        <select value={filters.project} onChange={e => handleChange('project', e.target.value)} className="block w-full rounded-lg border-gray-200 text-xs py-2 px-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Status */}
                <div className="col-span-1 md:col-span-1 lg:w-28">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Status</label>
                    <select value={filters.status} onChange={e => handleChange('status', e.target.value)} className="block w-full rounded-lg border-gray-200 text-xs py-2 px-2 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="col-span-2 md:col-span-4 lg:flex-1 flex items-end gap-2 justify-end mt-2 lg:mt-0">
                    <button onClick={clearFilters} className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    <button onClick={applyFilters} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 h-[34px]"><Filter className="w-3.5 h-3.5" /> Filter</button>
                </div>
            </div>
        </div>
    )
}