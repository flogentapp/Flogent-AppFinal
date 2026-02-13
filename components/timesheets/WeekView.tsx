'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AddEntryModal } from './AddEntryModal'
import { DayDetailModal } from './DayDetailModal'
import { cn } from '@/lib/utils'
import { deleteTimeEntry } from '@/lib/actions/timesheets'
import { toast } from 'sonner'

export function WeekView({ entries, projects, user, companies }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<any>(null)

  // NEW STATE FOR DETAILS
  const [viewDate, setViewDate] = useState<Date | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  // Helper to get entries for a specific day
  const getDayEntries = (date: Date) => {
    return entries.filter((e: any) => isSameDay(new Date(e.date), date))
  }

  const handleAddTime = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setEditingEntry(null)
    setIsAddOpen(true)
  }

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry)
    setSelectedDate(null)
    setIsAddOpen(true)
  }

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this entry?')) return
    setDeletingId(id)
    const res = await deleteTimeEntry(id)
    setDeletingId(null)
    if (res?.error) toast.error(res.error)
    else toast.success('Entry deleted')
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

      </div>

      {/* Week Grid - Scrollable on mobile */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-7 gap-3 sm:gap-4 min-w-[800px] lg:min-w-0">
          {weekDays.map((day) => {
            const dayEntries = getDayEntries(day)
            const total = getDailyTotal(day)
            const isToday = isSameDay(day, new Date())

            return (
              <div key={day.toISOString()} className="flex flex-col gap-3 group/day">
                {/* Day Header */}
                <div className="relative">
                  <button
                    onClick={() => handleAddTime(day)}
                    className={cn(
                      "w-full p-3 rounded-xl text-center border transition-all hover:shadow-md group/header",
                      isToday ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 hover:border-indigo-300"
                    )}
                  >
                    <div className={cn("text-[10px] sm:text-xs font-medium uppercase mb-1", isToday ? "text-indigo-100" : "text-gray-500")}>
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{format(day, 'd')}</div>

                    <div className={cn("mt-2 text-[10px] sm:text-xs flex items-center justify-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity", isToday ? "text-white" : "text-indigo-600")}>
                      <Plus className="w-3 h-3" /> Log Time
                    </div>
                  </button>
                </div>

                {/* Day Card Summary */}
                <div
                  className={cn(
                    "flex-1 bg-white border border-gray-100 rounded-xl p-3 min-h-[140px] transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md group/card",
                    total > 0 ? "bg-white" : "bg-gray-50/50 border-dashed"
                  )}
                  onClick={() => openDayDetails(day)}
                >
                  {total > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="text-center py-2 border-b border-gray-50">
                        <span className="text-xl sm:text-2xl font-black text-indigo-600 leading-none">{total.toFixed(2).replace(/\.00$/, '')}</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 ml-1 tracking-wider uppercase">h</span>
                      </div>
                      <div className="flex-1 py-3 space-y-1.5 overflow-hidden">
                        {dayEntries.slice(0, 3).map((e: any) => (
                          <div key={e.id} className="text-[10px] sm:text-xs truncate text-gray-500 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                            <span className="font-medium">{e.project?.name || 'Unknown'}</span>
                          </div>
                        ))}
                        {dayEntries.length > 3 && (
                          <div className="text-[10px] text-center text-gray-400 font-bold mt-1">
                            +{dayEntries.length - 3} MORE
                          </div>
                        )}
                      </div>

                      {/* QUICK ACTIONS ROW */}
                      <div className="flex items-center justify-around pt-2 border-t border-gray-50 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm -mx-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDayDetails(day); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {dayEntries.length === 1 && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditEntry(dayEntries[0]); }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit Entry"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteEntry(dayEntries[0].id, e)}
                              disabled={deletingId === dayEntries[0].id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Entry"
                            >
                              {deletingId === dayEntries[0].id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                      <span className="text-sm font-medium mb-3 opacity-50">-</span>
                      <div className="text-[10px] text-gray-400 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        View Details
                      </div>
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
        onClose={() => {
          setIsAddOpen(false)
          setEditingEntry(null)
          setSelectedDate(null)
        }}
        projects={projects}
        companies={companies}
        user={user}
        entryToEdit={editingEntry}
        initialDate={selectedDate}
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