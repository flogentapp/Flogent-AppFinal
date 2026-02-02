'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { getWeekStart, formatDateDisplay } from '@/lib/utils/dateHelpers'

interface WeekNavigationProps {
    currentDate: Date
}

export function WeekNavigation({ currentDate }: WeekNavigationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const weekStart = getWeekStart(currentDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const handlePrevWeek = () => {
        const prev = new Date(weekStart)
        prev.setDate(prev.getDate() - 7)
        updateWeek(prev)
    }

    const handleNextWeek = () => {
        const next = new Date(weekStart)
        next.setDate(next.getDate() + 7)
        updateWeek(next)
    }

    const handleToday = () => {
        updateWeek(new Date())
    }

    const updateWeek = (date: Date) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', date.toISOString().split('T')[0])
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                    {formatDateDisplay(weekStart)} - {formatDateDisplay(weekEnd)}
                </span>
            </div>

            <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            <button
                onClick={handleToday}
                className="ml-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Today
            </button>
        </div>
    )
}
