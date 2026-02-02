'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LogOut, Menu, X, Home, Clock, Shield, Check, FileText, CheckSquare, UserCog, Package } from 'lucide-react'
import { useState } from 'react'
import { logout } from '@/lib/actions/auth'
import { switchCompany } from '@/lib/actions/user'

type Company = { id: string; name: string }

type NavbarContentProps = {
    userEmail: string
    userName: string
    currentCompany: Company
    availableCompanies: Company[]
    enabledApps: string[]
}

export function NavbarContent({ userEmail, userName, currentCompany, availableCompanies, enabledApps }: NavbarContentProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (path: string) => pathname?.startsWith(path)
        ? "bg-indigo-50 text-indigo-700 font-bold"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"

    const handleSwitch = async (id: string) => {
        if (id === currentCompany.id) return
        await switchCompany(id)
        setIsOpen(false)
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* LEFT: Branding */}
                    <div className="flex items-center gap-4">
                        <Link href="/app" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                                <span className="text-white font-bold">F</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Flogent</span>
                        </Link>
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="flex items-center gap-3">

                        {/* 1. Home Button */}
                        <Link href="/app" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200" title="Go to Hub">
                            <Home className="w-5 h-5" />
                        </Link>

                        {/* 2. Current Company Label */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider max-w-[150px] truncate">
                                {currentCompany.name}
                            </span>
                        </div>

                        {/* 3. Hamburger Menu */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN MENU DROPDOWN */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl animate-in slide-in-from-top-2 duration-200 z-40">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* COLUMN 1: SWITCH ORGANIZATION */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Switch Organization</h3>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                    {availableCompanies.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSwitch(c.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${c.id === currentCompany.id
                                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Building2 className={`w-4 h-4 ${c.id === currentCompany.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                <span className="truncate">{c.name}</span>
                                            </span>
                                            {c.id === currentCompany.id && <Check className="w-4 h-4 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                                <hr className="md:hidden my-6 border-gray-100" />
                            </div>

                            {/* COLUMN 2: APPS & MANAGEMENT */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Apps</h3>
                                <div className="space-y-1">
                                    {/* Timesheets */}
                                    {enabledApps.includes('timesheets') && (
                                        <Link onClick={() => setIsOpen(false)} href="/timesheets/my" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/timesheets')}`}>
                                            <Clock className="w-4 h-4" /> Timesheets
                                        </Link>
                                    )}

                                    {/* Documents */}
                                    {enabledApps.includes('documents') && (
                                        <Link onClick={() => setIsOpen(false)} href="/documents" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/documents')}`}>
                                            <FileText className="w-4 h-4" /> Documents
                                        </Link>
                                    )}

                                    {/* Tasks */}
                                    {enabledApps.includes('tasks') && (
                                        <Link onClick={() => setIsOpen(false)} href="/tasks" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/tasks')}`}>
                                            <CheckSquare className="w-4 h-4" /> Tasks
                                        </Link>
                                    )}

                                    {/* Placeholder for no apps */}
                                    {enabledApps.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-400 italic">No apps enabled</div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Management</h3>
                                    <div className="space-y-1">
                                        <Link onClick={() => setIsOpen(false)} href="/admin/companies" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/admin/companies')}`}>
                                            <Shield className="w-4 h-4" /> Companies & Depts
                                        </Link>
                                        <Link onClick={() => setIsOpen(false)} href="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/admin/users')}`}>
                                            <UserCog className="w-4 h-4" /> Users & Roles
                                        </Link>
                                        <Link onClick={() => setIsOpen(false)} href="/admin/apps" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/admin/apps')}`}>
                                            <Package className="w-4 h-4" /> App Subscriptions
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 3: PROFILE */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                            {userName.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-sm font-bold text-gray-900 truncate">{userName}</div>
                                            <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                                        </div>
                                    </div>
                                    <form action={logout}>
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-screen bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
                </div>
            )}
        </nav>
    )
}