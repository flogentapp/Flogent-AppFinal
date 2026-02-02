'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Clock, AlignLeft, Building2 } from 'lucide-react'

type Entry = {
  id: string
  date: string
  hours: number
  description?: string
  status: string
  project?: { name: string; code: string }
  tenant?: { name: string }
}

export function DayDetailModal({ 
  isOpen, 
  onClose, 
  date, 
  entries 
}: { 
  isOpen: boolean
  onClose: () => void
  date: Date | null
  entries: Entry[]
}) {
  if (!date) return null

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-xl">
            <span>{format(date, 'EEEE, MMMM do')}</span>
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {totalHours}h Total
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No entries for this day.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-4 border rounded-xl bg-gray-50/50 space-y-3 hover:bg-gray-50 transition-colors">
                
                {/* Header: Project & Hours */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{entry.project?.name || 'No Project'}</h4>
                    {entry.tenant && (
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Building2 className="w-3 h-3 mr-1" />
                            {entry.tenant.name}
                        </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{entry.hours}h</span>
                  </div>
                </div>

                {/* Description */}
                {entry.description && (
                  <div className="flex gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                    <AlignLeft className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="whitespace-pre-wrap">{entry.description}</p>
                  </div>
                )}

                {/* Footer: Status */}
                <div className="flex justify-end">
                    <StatusBadge status={entry.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}