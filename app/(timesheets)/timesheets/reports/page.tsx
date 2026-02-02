import { getReportData } from '@/lib/actions/timesheets'
import { ReportsClient } from '@/components/timesheets/ReportsClient'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function ReportsPage() {
  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) {
    return <div className="p-8 text-center text-gray-500">Access Denied: You do not have reporting permissions.</div>
  }

  // Fetch data with scoped filtering
  const data = await getReportData()

  // Pass it to the client component for filtering
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReportsClient initialData={data} />
    </div>
  )
}