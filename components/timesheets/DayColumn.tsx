'use client'

import { Database } from '@/lib/types/database'
import { formatDate } from '@/lib/utils/dateHelpers'
import { TimeEntryCard } from './TimeEntryCard'
import { Plus } from 'lucide-react'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']

export function DayColumn({
    date,
    entries,
    onAddEntry,
}: {
    date: Date
    entries: any[]
    onAddEntry: (date: Date) => void
}) {
    const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0)
    const totalDisplay = `${totalHours.toFixed(2).replace(/\.00$/, '')}h`

    const isToday = formatDate(new Date()) === formatDate(date)

    return (
        <div className="flex-1 min-w-[160px] flex flex-col h-full border-r border-gray-100 last:border-r-0 transition-colors">
            <div className={`p-4 text-center border-b border-gray-100 ${isToday ? 'bg-indigo-50/50' : 'bg-gray-50/30'}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {date.getDate()}
                </div>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-2 ${totalHours > 0 ? (isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700') : 'text-gray-400'}`}>
                    {totalHours > 0 ? totalDisplay : '0h'}
                </div>
            </div>
            <div className="flex-1 p-3 bg-white/50 space-y-3 overflow-y-auto custom-scrollbar">
                {entries.map((entry) => (
                    <TimeEntryCard key={entry.id} entry={entry} />
                ))}
                <button
                    onClick={() => onAddEntry(date)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 flex items-center justify-center transition-all duration-200 group mt-2"
                >
                    <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    )
}
