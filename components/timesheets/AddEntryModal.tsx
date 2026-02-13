import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>Date</label>
              <Input
                type='date'
                name='date'
                required
                defaultValue={entryToEdit?.date || entryToEdit?.entry_date || initialDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>Hours</label>
              <Input
                type='number'
                name='hours'
                step='any'
                required
                placeholder='e.g. 4.12'
                defaultValue={entryToEdit?.hours || ''}
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>Project</label>
            <select
              name='project_id'
              className='w-full border rounded-md p-2 bg-white text-sm h-10'
              required
              defaultValue={entryToEdit?.project_id || ''}
            >
              <option value=''>Select Project...</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-xs font-bold text-gray-500 uppercase mb-1'>Description</label>
            <textarea
              name='description'
              className='w-full border rounded-md p-2 text-sm'
              rows={2}
              placeholder='Standard work description...'
              defaultValue={entryToEdit?.description || ''}
            ></textarea>
          </div>

          {/* ADDITIONAL WORK TOGGLE */}
          <div className='space-y-3 pt-2 border-t border-gray-100'>
            <div
              className={'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ' + (isAdditional ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300')}
              onClick={() => setIsAdditional(!isAdditional)}
            >
              <div className={'w-5 h-5 rounded border flex items-center justify-center transition-colors ' + (isAdditional ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-gray-400')}>
                {isAdditional && <span className="text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1">
                <span className={'block text-sm font-bold ' + (isAdditional ? 'text-amber-800' : 'text-gray-700')}>Additional Work</span>
                <span className="text-xs text-gray-400">Mark this as out-of-scope / extra work</span>
              </div>
            </div>

            {/* REASON FIELD - Shows only when toggle is ON */}
            {isAdditional && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className='block text-xs font-bold text-amber-700 uppercase mb-1 ml-1 flex items-center gap-1'>
                  <AlertCircle className="w-3 h-3" />
                  Reason for Additional Work
                </label>
                <textarea
                  name='additional_work_reason'
                  required={isAdditional}
                  className='w-full border border-amber-300 rounded-md p-2 text-sm bg-amber-50/50 focus:ring-amber-500 focus:border-amber-500 placeholder:text-amber-400 text-amber-900'
                  rows={2}
                  placeholder='e.g. Client requested changes to the original scope...'
                  defaultValue={entryToEdit?.additional_work_description || ''}
                ></textarea>
              </div>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? <Loader2 className='animate-spin w-4 h-4' /> : (entryToEdit ? 'Update Entry' : 'Save Entry')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
