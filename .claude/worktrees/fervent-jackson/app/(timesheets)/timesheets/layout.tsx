import { AppNavbar } from '@/components/layout/AppNavbar'
import { TimesheetNav } from '@/components/timesheets/TimesheetNav'

export default function TimesheetsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* 1. Global Navbar */}
            <AppNavbar />

            {/* 2. Sub-Navigation Tabs (The "Big Change") */}
            <TimesheetNav />
            
            {/* 3. Page Content */}
            <div className="py-8">
                <main>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}