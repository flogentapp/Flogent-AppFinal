'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { deleteTimeEntry } from '@/lib/actions/timesheets'

interface TimeEntryCardProps {
    entry: {
        id: string
        project_name?: string
        hours: number
        minutes: number
        description: string
        status: string
        is_additional_work: boolean
    }
    onEdit?: (entry: any) => void
}

export function TimeEntryCard({ entry, onEdit }: TimeEntryCardProps) {
    const statusColors = {
        draft: 'bg-gray-100 text-gray-800 border-gray-200',
        submitted: 'bg-blue-100 text-blue-800 border-blue-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200'
    }

    const handleDelete = async () => {
        if (confirm('Delete this time entry?')) {
            await deleteTimeEntry(entry.id)
        }
    }

    return (
        <div className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow group">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">
                        {entry.project_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {entry.description}
                    </div>
                    {entry.is_additional_work && (
                        <span className="inline-block mt-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                            ADDITIONAL
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-3">
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                            {entry.hours}h {entry.minutes}m
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusColors[entry.status as keyof typeof statusColors]}`}>
                            {entry.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {entry.status === 'draft' && onEdit && (
                            <button
                                onClick={() => onEdit(entry)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        )}
                        {entry.status === 'draft' && (
                            <button
                                onClick={handleDelete}
                                className="p-1 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
