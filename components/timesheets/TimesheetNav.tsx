'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Grid, CheckSquare, FileBarChart } from 'lucide-react'

export function TimesheetNav() {
    const pathname = usePathname()
    
    const tabs = [
        { name: 'My Timesheet', href: '/timesheets/my', icon: Grid },
        { name: 'Approvals', href: '/timesheets/approvals', icon: CheckSquare },
        { name: 'Reports', href: '/timesheets/reports', icon: FileBarChart },
    ]

    return (
        <div className="border-b border-gray-200 bg-white sticky top-16 z-40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname?.startsWith(tab.href)
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm gap-2
                                    ${isActive
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                {tab.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}