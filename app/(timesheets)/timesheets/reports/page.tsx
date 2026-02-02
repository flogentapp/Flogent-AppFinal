import { getReportData } from '@/lib/actions/timesheets'
import { ReportsClient } from '@/components/timesheets/ReportsClient'

export default async function ReportsPage() {
  // Fetch data with scoped filtering
  const data = await getReportData()

  // Pass it to the client component for filtering
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReportsClient initialData={data} />
    </div>
  )
}