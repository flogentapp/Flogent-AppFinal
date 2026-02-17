import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { logTime, updateTimeEntry } from '@/lib/actions/timesheets'
import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddEntryModal({ isOpen, onClose, projects, entryToEdit, initialDate }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdditional, setIsAdditional] = useState(false)
  const router = useRouter()

  // Sync state with entryToEdit when it changes or modal opens
  useEffect(() => {
    if (isOpen && entryToEdit) {
      setIsAdditional(!!entryToEdit.is_additional_work)
    } else if (isOpen && !entryToEdit) {
      setIsAdditional(false)
    }
  }, [isOpen, entryToEdit])

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError('')

    // Manual checkbox handling because 'isAdditional' state drives the UI
    if (isAdditional) formData.set('is_additional_work', 'on')

    const res = entryToEdit
      ? await updateTimeEntry(entryToEdit.id, formData)
      : await logTime(formData)

    setLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      onClose()
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{entryToEdit ? 'Edit Time Entry' : 'Log Time'}</DialogTitle>
        </DialogHeader>

        {error && <div className='bg-red-50 text-red-600 p-3 text-sm rounded mb-4 border border-red-100'>{error}</div>}

        <form action={handleSubmit} className='space-y-4'>
          <Input
            label="Date"
            type='date'
            name='date'
            required
            defaultValue={entryToEdit?.date || entryToEdit?.entry_date || initialDate || new Date().toISOString().split('T')[0]}
          />

          <div>
            <label className='block text-sm font-bold text-gray-700 uppercase tracking-tight mb-1 ml-1'>Project</label>
            <select
              name='project_id'
              className='w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 border-transparent appearance-none'
              required
              defaultValue={entryToEdit?.project_id || ''}
            >
              <option value=''>Select Project...</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Hours"
            type='number'
            name='hours'
            step='any'
            required
            placeholder='e.g. 4.12'
            defaultValue={entryToEdit?.hours || ''}
          />

          <Textarea
            label="Description"
            name="description"
            rows={2}
            placeholder="Standard work description..."
            defaultValue={entryToEdit?.description || ''}
          />

          {/* ADDITIONAL WORK TOGGLE */}
          <div className='space-y-3 pt-2 border-t border-gray-100'>
            <div
              className={'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ' + (isAdditional ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200')}
              onClick={() => setIsAdditional(!isAdditional)}
            >
              <div className={'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ' + (isAdditional ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-slate-300')}>
                {isAdditional && <span className="text-xs font-black">✓</span>}
              </div>
              <div className="flex-1">
                <span className={'block text-sm font-black uppercase tracking-tight ' + (isAdditional ? 'text-amber-900' : 'text-slate-600')}>Additional Work</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mark as out-of-scope / extra</span>
              </div>
            </div>

            {/* REASON FIELD - Shows only when toggle is ON */}
            {isAdditional && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 pt-1">
                <Textarea
                  name='additional_work_reason'
                  required={isAdditional}
                  label="Reason for Additional Work"
                  className='border-amber-200 bg-white placeholder:text-amber-200 text-amber-900'
                  rows={2}
                  placeholder='e.g. Client requested changes to the original scope...'
                  defaultValue={entryToEdit?.additional_work_description || ''}
                />
              </div>
            )}
          </div>

          <Button type='submit' className='w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 mt-4' disabled={loading}>
            {loading ? <Loader2 className='animate-spin w-5 h-5' /> : (entryToEdit ? 'Update Entry' : 'Post Time Entry')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
