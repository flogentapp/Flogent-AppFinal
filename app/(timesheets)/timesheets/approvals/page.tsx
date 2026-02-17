import { getPendingApprovals, updateTimesheetStatus } from '@/lib/actions/timesheets'
import { Button } from '@/components/ui/Button'
import { Check, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { getUserPermissions } from '@/lib/actions/permissions'

export default async function ApprovalsPage() {
  const permissions = await getUserPermissions()
  if (!permissions.canManageAny) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Access Denied</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">You do not have the required permissions to access the approval queue.</p>
        </div>
      </div>
    )
  }

  const pending = await getPendingApprovals()
  const totalHours = pending.reduce((sum: number, item: any) => sum + item.hours, 0)

  return (
    <div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8'>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h1 className='text-2xl sm:text-3xl font-black text-gray-900 tracking-tight'>Approval Queue</h1>
          <p className="text-gray-500 text-sm font-medium">Authorizing team timesheets and project logs.</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
          <div className="text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Hours</div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 leading-none">
              {totalHours.toFixed(1)}<span className="text-xs ml-0.5 opacity-50 italic">h</span>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200 shrink-0"></div>
          <div className="text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Queue Size</div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{pending.length}</div>
          </div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className='text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-200 text-gray-400 shadow-sm'>
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className='w-10 h-10 opacity-20' />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">Inbox Zero!</h3>
          <p className="font-medium text-sm text-gray-500">All timesheets have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {/* MOBILE CARD VIEW */}
          {pending.map((item: any) => (
            <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                      {item.profiles?.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm leading-tight">{item.profiles?.first_name} {item.profiles?.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-black mt-0.5 uppercase tracking-wider">
                        {item.projects?.departments?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900 leading-none tracking-tight">{item.hours}h</div>
                    <div className="text-[10px] text-indigo-600 font-black mt-1 uppercase tracking-widest">{format(new Date(item.date), 'MMM d')}</div>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wide">{item.projects?.name}</div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-3">
                      "{item.description}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <form className="flex-1" action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'rejected') }}>
                    <Button variant='outline' className='w-full rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 border-red-50 h-12 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95'>
                      Reject
                    </Button>
                  </form>
                  <form className="flex-[2]" action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'approved') }}>
                    <Button className='w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-100 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95'>
                      Approve Log
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DESKTOP TABLE VIEW */}
      {!pending.length ? null : (
        <div className='hidden lg:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden'>
          <table className='min-w-full divide-y divide-gray-100'>
            <thead>
              <tr className="bg-gray-50/50">
                <th className='px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>Employee</th>
                <th className='px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>Project Context</th>
                <th className='px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>Date</th>
                <th className='px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>Duration</th>
                <th className='px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {pending.map((item: any) => (
                <tr key={item.id} className='hover:bg-indigo-50/30 transition-all group'>
                  <td className='px-8 py-6'>
                    <div className='flex items-center gap-4'>
                      <div className="w-10 h-10 bg-slate-100 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-white font-black text-sm uppercase transition-all shadow-sm">
                        {item.profiles?.first_name?.charAt(0)}
                      </div>
                      <div>
                        <div className='font-black text-gray-900 text-sm'>{item.profiles?.first_name} {item.profiles?.last_name}</div>
                        <div className='text-[10px] text-slate-400 font-bold uppercase tracking-wider'>{item.projects?.departments?.name || 'General'}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-8 py-6'>
                    <div>
                      <div className='text-sm font-black text-indigo-600 mb-0.5'>{item.projects?.name}</div>
                      {item.description && (
                        <div className='text-xs text-slate-400 font-medium italic truncate max-w-[200px]'>"{item.description}"</div>
                      )}
                    </div>
                  </td>
                  <td className='px-8 py-6'>
                    <div className='text-sm font-bold text-gray-600 whitespace-nowrap'>
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className='px-8 py-6 text-right'>
                    <div className='text-lg font-black text-gray-900'>{item.hours.toFixed(1)}h</div>
                  </td>
                  <td className='px-8 py-6'>
                    <div className="flex justify-end gap-3">
                      <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'rejected') }}>
                        <Button variant='outline' size='sm' className='rounded-xl text-red-500 hover:bg-red-50 hover:text-red-100 border-red-50/50 h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all'>
                          Reject
                        </Button>
                      </form>
                      <form action={async () => { 'use server'; await updateTimesheetStatus(item.id, 'approved') }}>
                        <Button size='sm' className='rounded-xl bg-slate-900 hover:bg-indigo-600 text-white h-10 px-6 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95'>
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
      )}
    </div>
  )
}
