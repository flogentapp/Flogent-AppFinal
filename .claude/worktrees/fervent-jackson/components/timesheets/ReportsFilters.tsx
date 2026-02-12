'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Filter, X, Building2, Folder, Users, User as UserIcon } from 'lucide-react'

interface ReportsFiltersProps {
    companies: any[]
    departments: any[]
    projects: any[]
    users: any[]
}

export function ReportsFilters({ companies, departments, projects, users }: ReportsFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [filters, setFilters] = useState({
        company: searchParams.get('company') || '',
        department: searchParams.get('department') || '',
        project: searchParams.get('project') || '',
        user: searchParams.get('user') || '',
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
        setFilters({ company: '', department: '', project: '', user: '' })
        router.push('?')
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Company Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Company
                    </label>
                    <select
                        value={filters.company}
                        onChange={e => handleChange('company', e.target.value)}
                        className="block w-full rounded-lg border-gray-200 text-sm py-2 px-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Companies</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Department Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5" /> Department
                    </label>
                    <select
                        value={filters.department}
                        onChange={e => handleChange('department', e.target.value)}
                        className="block w-full rounded-lg border-gray-200 text-sm py-2 px-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>

                {/* Project Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5" /> Project
                    </label>
                    <select
                        value={filters.project}
                        onChange={e => handleChange('project', e.target.value)}
                        className="block w-full rounded-lg border-gray-200 text-sm py-2 px-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* User Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" /> User
                    </label>
                    <select
                        value={filters.user}
                        onChange={e => handleChange('user', e.target.value)}
                        className="block w-full rounded-lg border-gray-200 text-sm py-2 px-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Users</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                >
                    <X className="w-4 h-4" /> Clear
                </button>
                <button
                    onClick={applyFilters}
                    className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" /> Apply Filters
                </button>
            </div>
        </div>
    )
}