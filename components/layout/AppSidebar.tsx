'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Clock,
    Shield,
    X,
    Lock,
    LogOut,
    Building2,
    Users,
    Package,
    ChevronDown,
    Grid,
    ClipboardCheck
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { switchCompany } from '@/lib/actions/user'
import type { UserPermissions } from '@/types/permissions'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useUI } from '@/components/providers/UIProvider'

type Company = { id: string; name: string }

type SidebarProps = {
    userEmail: string
    userName: string
    currentCompany?: Company
    availableCompanies?: Company[]
    enabledApps?: string[]
    permissions?: UserPermissions
    onClose?: () => void
}

export function AppSidebar({
    userEmail = '',
    userName = 'Guest',
    currentCompany,
    availableCompanies = [],
    enabledApps = [],
    permissions,
    onClose
}: SidebarProps) {
    const { activeDropdown, setActiveDropdown } = useUI()
    const isCompanyMenuOpen = activeDropdown === 'sidebar-company'
    const companyMenuRef = useRef<HTMLDivElement>(null)

    useClickOutside(companyMenuRef, () => {
        if (isCompanyMenuOpen) setActiveDropdown(null)
    })

    const pathname = usePathname()

    const isActive = (path: string) => {
        if (!pathname) return false
        return pathname === path || pathname.startsWith(path + '/')
    }

    // AUTH MASTER OVERRIDE
    const isOwner = permissions?.isOwner || false
    const canManageAny = permissions?.canManageAny || false
    const isCEO = permissions?.isCEO || false

    // If Owner, we Force Enable everything
    const activeApps = isOwner ? ['timesheets', 'task_planner', 'daily_diary'] : (enabledApps || [])

    const NavItem = ({ href, icon: Icon, label, active = false }: any) => (
        <Link
            href={href}
            onClick={onClose}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
        >
            <Icon className={cn("w-5 h-5", active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
            <span className="font-bold text-sm tracking-tight">{label}</span>
        </Link>
    )

    return (
        <aside className="w-full h-full bg-white flex flex-col border-r border-slate-100">
            {/* BRAND */}
            <div className="p-6 border-b border-slate-50 mb-4 bg-white sticky top-0 z-20">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/app" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                            <span className="text-white font-black text-xl">F</span>
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">Flogent</span>
                    </Link>
                    {onClose && (
                        <button onClick={onClose} className="p-2 -mr-2 text-slate-400 lg:hidden">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="relative" ref={companyMenuRef}>
                    <button
                        onClick={() => setActiveDropdown(isCompanyMenuOpen ? null : 'sidebar-company')}
                        className="w-full flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                    >
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Organization</div>
                            <div className="text-sm font-black text-slate-900 truncate">
                                {currentCompany?.name || 'Select Company'}
                            </div>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCompanyMenuOpen && "rotate-180")} />
                    </button>

                    {isCompanyMenuOpen && availableCompanies.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                                {availableCompanies.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={async () => {
                                            await switchCompany(c.id)
                                            setActiveDropdown(null)
                                            window.location.reload()
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors mb-1",
                                            c.id === currentCompany?.id ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-50 text-slate-600 font-semibold"
                                        )}
                                    >
                                        <Building2 className="w-4 h-4 shrink-0" />
                                        <span className="text-xs truncate">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto px-4 pb-10">
                <NavItem href="/app" icon={LayoutDashboard} label="Home" active={isActive('/app')} />

                <div className="mt-8 mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Applications
                </div>

                <div className="space-y-1">
                    {activeApps.includes('timesheets') && (
                        <div className="space-y-1">
                            <NavItem href="/timesheets/my" icon={Clock} label="Timesheets" active={isActive('/timesheets')} />

                            {canManageAny && (
                                <div className="ml-5 pl-4 border-l-2 border-slate-100 space-y-2 mt-2 mb-2">
                                    <Link
                                        href="/timesheets/approvals"
                                        onClick={onClose}
                                        className={cn(
                                            "block py-1 text-xs font-black transition-colors uppercase tracking-wider",
                                            isActive('/timesheets/approvals') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                                        )}
                                    >
                                        Approvals
                                    </Link>
                                    <Link
                                        href="/timesheets/reports"
                                        onClick={onClose}
                                        className={cn(
                                            "block py-1 text-xs font-black transition-colors uppercase tracking-wider",
                                            isActive('/timesheets/reports') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                                        )}
                                    >
                                        Reports
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeApps.includes('task_planner') && (
                        <NavItem href="/planner" icon={Package} label="Planner" active={isActive('/planner')} />
                    )}

                    {activeApps.includes('daily_diary') && (
                        <NavItem href="/diary" icon={ClipboardCheck} label="Daily Diary" active={isActive('/diary')} />
                    )}
                </div>

                {canManageAny && (
                    <>
                        <div className="mt-8 mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Organization
                        </div>
                        <div className="space-y-1">
                            <NavItem href="/admin/companies" icon={Grid} label="Management" active={isActive('/admin/companies')} />
                            {(isOwner || isCEO) && (
                                <NavItem href="/admin/users" icon={Users} label="Team" active={isActive('/admin/users')} />
                            )}
                            {isOwner && (
                                <NavItem href="/admin/apps" icon={Shield} label="Billing & Apps" active={isActive('/admin/apps')} />
                            )}
                        </div>
                    </>
                )}
            </nav>

            {/* USER INFO */}
            <div className="p-4 border-t border-slate-50 bg-white">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 text-lg">
                        {userName.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 truncate">{userName}</div>
                        <div className="text-[10px] text-slate-400 font-bold truncate tracking-wider">{userEmail}</div>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    )
}
