import { getPendingApprovals, updateTimesheetStatus } from '@/lib/actions/timesheets'
import { Button } from '@/components/ui/Button'
import { Check, X, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default async function ApprovalsPage() {
  const pending = await getPendingApprovals()

  return (
    <div className='p-8 max-w-5xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Pending Approvals</h1>

      {pending.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-xl border border-dashed text-gray-500'>
          <Clock className='w-12 h-12 mx-auto mb-3 opacity-20' />
          <p>No pending approvals found.</p>
        </div>
      ) : (
        <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
          <table className='min-w-full divide-y divide-gray-100'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>User</th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>Project</th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>Date</th>
                <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>Hours</th>
                <th className='px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {pending.map((item: any) => (
                <tr key={item.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <div className='font-medium text-gray-900'>{item.profiles?.first_name} {item.profiles?.last_name}</div>
                    <div className='text-xs text-gray-500'>{item.profiles?.email}</div>
                  </td>
                  <td className='px-6 py-4 text-sm'>{item.projects?.name}</td>
                  <td className='px-6 py-4 text-sm text-gray-500'>{format(new Date(item.date), 'MMM d, yyyy')}</td>
                  <td className='px-6 py-4 font-bold'>{item.hours}h</td>
                  <td className='px-6 py-4 flex justify-end gap-2'>
                    <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'rejected') }}>
                      <Button variant='outline' size='sm' className='text-red-600 hover:bg-red-50 border-red-100'><X className='w-4 h-4' /></Button>
                    </form>
                    <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'approved') }}>
                      <Button size='sm' className='bg-green-600 hover:bg-green-700 text-white'><Check className='w-4 h-4' /></Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
