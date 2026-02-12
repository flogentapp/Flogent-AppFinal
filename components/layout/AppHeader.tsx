'use client'

import { Search, Bell, Menu, X, Briefcase, Layers } from 'lucide-react'
import { CompanySwitcher } from './CompanySwitcher'
import { SmartSearch } from './SmartSearch'
import { switchContext } from '@/lib/actions/context'

export function AppHeader({
    onMenuClick,
    companies = [],
    currentCompanyId = '',
    departments = [],
    projects = [],
    currentDepartmentId = null,
    currentProjectId = null,
}: {
    onMenuClick?: () => void
    companies?: any[]
    currentCompanyId?: string
    departments?: any[]
    projects?: any[]
    currentDepartmentId?: string | null
    currentProjectId?: string | null
}) {
    const activeDept = departments.find(d => d.id === currentDepartmentId)
    const activeProj = projects.find(p => p.id === currentProjectId)

    return (
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            {/* LEFT: MOBILE TOGGLE & SEARCH & CONTEXT BADGES */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <SmartSearch />

                {/* CONTEXT BADGES (Compact) */}
                <div className="hidden xl:flex items-center gap-2 border-l border-slate-100 pl-4 ml-2">
                    {activeDept && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2 transition-all">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-tight">{activeDept.name}</span>
                            <button
                                onClick={() => switchContext('department', null)}
                                className="hover:bg-indigo-100 p-0.5 rounded-md transition-colors"
                            >
                                <X className="w-3 h-3 text-indigo-400" />
                            </button>
                        </div>
                    )}
                    {activeProj && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2 transition-all">
                            <Briefcase className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight">{activeProj.name}</span>
                            <button
                                onClick={() => switchContext('project', null)}
                                className="hover:bg-emerald-100 p-0.5 rounded-md transition-colors"
                            >
                                <X className="w-3 h-3 text-emerald-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ACTIONS & SWITCHER */}
            <div className="flex items-center gap-2 md:gap-4">
                <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative mr-2">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <CompanySwitcher
                    companies={companies}
                    currentCompanyId={currentCompanyId}
                />
            </div>
        </header>
    )
}
