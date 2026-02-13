'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Eye, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AddEntryModal } from './AddEntryModal'
import { DayDetailModal } from './DayDetailModal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function WeekView({ entries, projects, user, companies }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAddOpen, setIsAddOpen] = useState(false)
  // NEW STATE FOR DETAILS
  const [viewDate, setViewDate] = useState<Date | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  // Helper to get entries for a specific day
  const getDayEntries = (date: Date) => {
    return entries.filter((e: any) => isSameDay(new Date(e.date), date))
  }

  const weekTotal = entries.filter((e: any) => {
    const d = new Date(e.date)
    return d >= startDate && d <= addDays(startDate, 6)
  }).reduce((sum: number, e: any) => sum + e.hours, 0)

  // Calculate daily totals
  const getDailyTotal = (date: Date) => {
    return getDayEntries(date).reduce((sum: number, e: any) => sum + e.hours, 0)
  }

  // Handle opening the Detail Modal
  const openDayDetails = (date: Date) => {
    setViewDate(date)
    setIsViewOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 sm:px-4 font-semibold min-w-[120px] sm:min-w-[140px] text-center text-xs sm:text-sm">
              {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs sm:text-sm">Today</Button>

          <div className="hidden sm:block h-8 w-px bg-gray-100 mx-2"></div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Weekly Total</span>
            <span className="text-lg sm:text-xl font-black text-indigo-600 leading-none">{weekTotal.toFixed(2).replace(/\.00$/, '')}<span className="text-xs font-bold text-gray-400 ml-0.5">h</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 text-xs sm:text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Log Time
          </Button>
        </div>
      </div>

      {/* Week Grid - Scrollable on mobile */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-7 gap-3 sm:gap-4 min-w-[800px] lg:min-w-0">
          {weekDays.map((day) => {
            const dayEntries = getDayEntries(day)
            const total = getDailyTotal(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div key={day.toISOString()} className="flex flex-col gap-3">
                {/* Day Header */}
                <button
                  onClick={() => openDayDetails(day)}
                  className={cn(
                    "p-3 rounded-xl text-center border transition-all hover:shadow-md group",
                    isToday ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 hover:border-indigo-300"
                  )}
                >
                  <div className={cn("text-[10px] sm:text-xs font-medium uppercase mb-1", isToday ? "text-indigo-100" : "text-gray-500")}>
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-lg sm:text-xl font-bold">{format(day, 'd')}</div>

                  <div className={cn("mt-2 text-[10px] sm:text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", isToday ? "text-white" : "text-indigo-600")}>
                    <Eye className="w-3 h-3" /> View
                  </div>
                </button>

                {/* Day Card Summary */}
                <div
                  className={cn(
                    "flex-1 bg-white border border-gray-100 rounded-xl p-3 min-h-[120px] transition-all cursor-pointer hover:border-indigo-300",
                    total > 0 ? "bg-white" : "bg-gray-50/50 border-dashed"
                  )}
                  onClick={() => openDayDetails(day)}
                >
                  {total > 0 ? (
                    <div className="space-y-2">
                      <div className="text-center py-2 border-b border-gray-50">
                        <span className="text-xl sm:text-2xl font-bold text-indigo-600">{total}</span>
                        <span className="text-[10px] sm:text-xs text-gray-400 ml-1">hrs</span>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {dayEntries.slice(0, 3).map((e: any) => (
                          <div key={e.id} className="text-[10px] sm:text-xs truncate text-gray-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                            {e.project?.name || 'Unknown'}
                          </div>
                        ))}
                        {dayEntries.length > 3 && (
                          <div className="text-[10px] sm:text-xs text-center text-gray-400 italic">
                            +{dayEntries.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                      -
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <AddEntryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        projects={projects}
        companies={companies}
        user={user}
      />

      <DayDetailModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        date={viewDate}
        entries={viewDate ? getDayEntries(viewDate) : []}
        projects={projects}
      />
    </div>
  )
}