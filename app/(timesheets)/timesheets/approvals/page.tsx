import { getPendingApprovals, updateTimesheetStatus } from '@/lib/actions/timesheets'
import { Button } from '@/components/ui/Button'
import { Check, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function ApprovalsPage() {
  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) {
    return <div className='p-8 text-center text-gray-500'>Access Denied: You do not have approval permissions.</div>
  }

  const pending = await getPendingApprovals()

  const totalHours = pending.reduce((sum: number, item: any) => sum + item.hours, 0)

  return (
    <div className='p-4 sm:p-8 max-w-6xl mx-auto space-y-8'>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className='text-2xl font-black text-gray-900 tracking-tight'>Pending Approvals</h1>
          <p className="text-gray-500 text-sm font-medium">Review and authorize submitted timesheets.</p>
        </div>
        <div className="flex items-center gap-6 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="text-right min-w-[100px]">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Pending</div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 leading-none">{totalHours.toFixed(1)}<span className="text-xs ml-0.5">h</span></div>
          </div>
          <div className="h-10 w-px bg-gray-100 shrink-0"></div>
          <div className="text-right min-w-[80px]">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Queue Size</div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{pending.length}</div>
          </div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className='text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 shadow-sm'>
          <Clock className='w-16 h-16 mx-auto mb-4 opacity-10' />
          <p className="font-medium">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MOBILE CARDS */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {pending.map((item: any) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                      {item.profiles?.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">{item.profiles?.first_name} {item.profiles?.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.projects?.departments?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600 leading-none">{item.hours}h</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase leading-none">{format(new Date(item.date), 'MMM d')}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mb-1">Project</div>
                  <div className="text-sm font-bold text-slate-900">{item.projects?.name}</div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium italic">"{item.description}"</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <form className="flex-1" action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'rejected') }}>
                    <Button variant='outline' className='w-full text-red-500 hover:bg-red-50 hover:text-red-600 border-red-50 h-11 font-black text-xs uppercase tracking-widest'>
                      Reject
                    </Button>
                  </form>
                  <form className="flex-[2]" action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'approved') }}>
                    <Button className='w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 shadow-lg shadow-indigo-100 font-black text-xs uppercase tracking-widest'>
                      Approve
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className='hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
            <div className="overflow-x-auto">
              <table className='min-w-full divide-y divide-gray-100'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>User</th>
                    <th className='px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Department</th>
                    <th className='px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Project</th>
                    <th className='px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Date</th>
                    <th className='px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Hours</th>
                    <th className='px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {pending.map((item: any) => (
                    <tr key={item.id} className='hover:bg-gray-50/50 transition-colors'>
                      <td className='px-6 py-5 whitespace-nowrap'>
                        <div className='flex items-center gap-3'>
                          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                            {item.profiles?.first_name?.charAt(0)}
                          </div>
                          <div>
                            <div className='font-bold text-gray-900 text-sm'>{item.profiles?.first_name} {item.profiles?.last_name}</div>
                            <div className='text-[10px] text-gray-400 font-medium'>{item.profiles?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-5 whitespace-nowrap'>
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-bold tracking-tight">
                          {item.projects?.departments?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className='px-6 py-5 whitespace-nowrap text-sm font-bold text-indigo-600'>
                        {item.projects?.name}
                      </td>
                      <td className='px-6 py-5 text-sm font-medium text-gray-600 whitespace-nowrap'>
                        {format(new Date(item.date), 'MMM d, yyyy')}
                      </td>
                      <td className='px-6 py-5 font-black text-gray-900 whitespace-nowrap'>{item.hours}h</td>
                      <td className='px-6 py-5 whitespace-nowrap'>
                        <div className="flex justify-end gap-2">
                          <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'rejected') }}>
                            <Button variant='outline' size='sm' className='text-red-500 hover:bg-red-50 hover:text-red-600 border-red-50 h-9 w-9 p-0'>
                              <X className='w-4 h-4' />
                            </Button>
                          </form>
                          <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'approved') }}>
                            <Button size='sm' className='bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 shadow-sm shadow-indigo-100 font-bold'>
                              Approve
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
