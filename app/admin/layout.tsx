import { AppShell } from '@/components/layout/AppShell'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AppShell>
            <div className="p-8">
                {children}
            </div>
        </AppShell>
    )
}

