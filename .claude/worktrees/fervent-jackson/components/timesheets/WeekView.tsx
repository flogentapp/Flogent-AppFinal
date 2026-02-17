'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils/dateHelpers'
import { AddEntryModal } from './AddEntryModal'

interface WeekViewProps {
    startDate: Date
    entries: any[]
    projects: any[]
    companies: any[]
    departments?: any[]
    defaultCompanyId?: string
}

export function WeekView({ startDate, entries, projects, companies, departments = [], defaultCompanyId }: WeekViewProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate)
        d.setDate(startDate.getDate() + i)
        return d
    })

    const handleAddClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    const dailyTotals = weekDays.map(day => {
        const dateStr = formatDate(day)
        return entries
            .filter(e => e.entry_date === dateStr)
            .reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0)
    })

    return (
        <div className="bg-white min-w-full">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Project / Task</div>
                {weekDays.map((day, i) => (
                    <div key={i} className={`p-4 text-center border-l border-gray-50 ${
                        formatDate(day) === formatDate(new Date()) ? 'bg-indigo-50/30' : ''
                    }`}>
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-black text-gray-900">
                            {day.getDate()}
                        </div>
                        <div className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                            dailyTotals[i] > 0 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-300'
                        }`}>
                            {dailyTotals[i]}h
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Buttons */}
            <div className="grid grid-cols-8 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <div className="p-4 flex items-center">
                    <button 
                        onClick={() => handleAddClick(new Date())}
                        className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-200 group-hover:border-indigo-300 flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                        </div>
                        Add Time
                    </button>
                </div>
                {weekDays.map((day, i) => (
                    <div key={i} className="p-2 border-l border-gray-50 flex items-center justify-center">
                        <button 
                            onClick={() => handleAddClick(day)}
                            className="w-full h-12 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center group/cell"
                        >
                            <Plus className="w-4 h-4 text-gray-300 group-hover/cell:text-indigo-500 opacity-0 group-hover/cell:opacity-100" />
                        </button>
                    </div>
                ))}
            </div>

            {entries.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400 italic">
                    No time entries for this week.
                </div>
            )}

            {/* Modal - PASS THE DATA HERE */}
            <AddEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                date={selectedDate}
                projects={projects}
                companies={companies}
                departments={departments}
                defaultCompanyId={defaultCompanyId}
            />
        </div>
    )
}