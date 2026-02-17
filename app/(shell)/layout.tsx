import { AppShell } from '@/components/layout/AppShell'
import { UIProvider } from '@/components/providers/UIProvider'

export default function ShellLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <UIProvider>
            <AppShell>{children}</AppShell>
        </UIProvider>
    )
}
