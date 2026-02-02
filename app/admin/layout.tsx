import { AppNavbar } from '@/components/layout/AppNavbar'
import Link from 'next/link'
import { Building2, Users, FolderOpen, Shield, ShieldCheck, Grid } from 'lucide-react'

// Mock admin check - In real app, check user role
const isAdmin = true

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // In a real implementation, we would check permissions here and redirect if not admin/owner.
    // For Phase 2 Launch, we will assume access to /admin is gated by RLS/Logic or we add a check page.

    return (
        <div className="min-h-screen bg-gray-50/50">
            <AppNavbar />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Admin Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">
                                Administration
                            </h2>
                            <nav className="space-y-1">
                                <NavLink href="/admin/companies" icon={Building2} label="Companies" />
                                <NavLink href="/admin/departments" icon={FolderOpen} label="Departments" />
                                <NavLink href="/admin/projects" icon={Grid} label="Projects" />
                                <NavLink href="/admin/users" icon={Users} label="Users & Roles" />
                                <div className="h-4"></div>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                    Configuration
                                </h2>
                                <NavLink href="/admin/approvals" icon={ShieldCheck} label="Approvals" />
                                <NavLink href="/admin/apps" icon={Shield} label="Applications" />
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors group"
        >
            <Icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            {label}
        </Link>
    )
}
