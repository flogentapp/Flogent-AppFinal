import { AppNavbar } from '@/components/layout/AppNavbar'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <AppNavbar />

            <div className="py-12">
                <main>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    )
}
