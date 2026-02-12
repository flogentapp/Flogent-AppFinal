'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Clock,
    CheckSquare,
    FileText,
    Building2,
    Users,
    Shield,
    ChevronDown,
    LogOut,
    Settings,
    Grid,
    X,
    Lock,
    LayoutGrid,
    Briefcase
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { logout } from '@/lib/actions/auth'
import { switchCompany } from '@/lib/actions/user'
import type { UserPermissions } from '@/types/permissions'

type Company = { id: string; name: string }

type SidebarProps = {
    userEmail: string
    userName: string
    currentCompany: Company
    availableCompanies: Company[]
    enabledApps: string[]
    permissions: UserPermissions
    onClose?: () => void
}

export function AppSidebar({
    userEmail,
    userName,
    currentCompany,
    availableCompanies,
    enabledApps,
    permissions,
    onClose
}: SidebarProps) {
    const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

    const NavItem = ({ href, icon: Icon, label, active = false }: any) => (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="font-semibold text-sm">{label}</span>
        </Link>
    )

    const SectionLabel = ({ label }: { label: string }) => (
        <div className="px-3 mt-6 mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            {label}
        </div>
    )

    return (
        <aside className="w-full h-full bg-white flex flex-col">
            {/* 1. BRAND & ORG SWITCHER */}
            <div className="p-6 flex items-center justify-between border-b border-slate-50 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <span className="text-white font-black text-xl">F</span>
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">Flogent</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. NAVIGATION */}
            <nav className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                <NavItem href="/app" icon={LayoutDashboard} label="Home" active={isActive('/app')} />

                <SectionLabel label="Your Subscriptions" />
                {enabledApps.includes('timesheets') ? (
                    <div className="space-y-1">
                        <NavItem href="/timesheets/my" icon={Clock} label="Timesheets" active={isActive('/timesheets/my')} />
                        {permissions.canManageAny && (
                            <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 mt-1">
                                <Link
                                    href="/timesheets/approvals"
                                    className={`block py-1.5 text-xs font-bold transition-colors ${isActive('/timesheets/approvals') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Approvals
                                </Link>
                                <Link
                                    href="/timesheets/reports"
                                    className={`block py-1.5 text-xs font-bold transition-colors ${isActive('/timesheets/reports') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Reports
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] font-bold text-slate-400">No active apps</p>
                    </div>
                )}

                <SectionLabel label="Marketplace" />
                <div className="space-y-1">
                    {!enabledApps.includes('documents') && (
                        <div className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-not-allowed hover:bg-slate-50 transition-all opacity-60 hover:opacity-100">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-300" />
                                <span className="font-semibold text-sm text-slate-400">Documents</span>
                            </div>
                            <Lock className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    )}
                    {!enabledApps.includes('tasks') && (
                        <div className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-not-allowed hover:bg-slate-50 transition-all opacity-60 hover:opacity-100">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-slate-300" />
                                <span className="font-semibold text-sm text-slate-400">Tasks</span>
                            </div>
                            <Lock className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    )}
                </div>

                {permissions.canManageAny && (
                    <>
                        <SectionLabel label="Organization" />
                        <NavItem href="/admin/companies" icon={Building2} label="Company Management" active={isActive('/admin/companies')} />
                        {(permissions.isOwner || permissions.isCEO) && (
                            <NavItem href="/admin/users" icon={Users} label="Team" active={isActive('/admin/users')} />
                        )}
                        {permissions.isOwner && (
                            <NavItem href="/admin/apps" icon={Shield} label="Billing & Apps" active={isActive('/admin/apps')} />
                        )}
                    </>
                )}
            </nav>

            {/* 3. FOOTER / USER */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{userName}</div>
                        <div className="text-xs text-slate-500 truncate">{userEmail}</div>
                    </div>
                    <form action={logout}>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    )
}
