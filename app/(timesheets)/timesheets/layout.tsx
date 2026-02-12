import { AppShell } from '@/components/layout/AppShell'

export default function TimesheetsLayout({
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