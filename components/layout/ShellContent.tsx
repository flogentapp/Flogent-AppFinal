'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import type { UserPermissions } from '@/types/permissions'

type Company = { id: string; name: string }

type ShellContentProps = {
    children: React.ReactNode
    userEmail: string
    userName: string
    currentCompany: Company
    availableCompanies: Company[]
    enabledApps: string[]
    permissions: UserPermissions
    departments: any[]
    projects: any[]
    currentDepartmentId: string | null
    currentProjectId: string | null
}

export function ShellContent({
    children,
    userEmail,
    userName,
    currentCompany,
    availableCompanies,
    enabledApps,
    permissions,
    departments,
    projects,
    currentDepartmentId,
    currentProjectId
}: ShellContentProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-[#FDFDFF]">
            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-[280px] bg-white transform transition-transform duration-300 lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            `}>
                <AppSidebar
                    userEmail={userEmail}
                    userName={userName}
                    currentCompany={currentCompany}
                    availableCompanies={availableCompanies}
                    enabledApps={enabledApps}
                    permissions={permissions}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <AppHeader
                    onMenuClick={() => setIsSidebarOpen(true)}
                    companies={availableCompanies}
                    currentCompanyId={currentCompany.id}
                    departments={departments}
                    projects={projects}
                    currentDepartmentId={currentDepartmentId}
                    currentProjectId={currentProjectId}
                />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
