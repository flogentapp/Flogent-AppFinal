export function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export function getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        dates.push(date)
    }
    return dates
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0] // YYYY-MM-DD
}

export function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    })
}

export function getTotalHours(entries: any[]): number {
    return entries.reduce((sum, e) => {
        const hours = e.hours || 0
        const minutes = e.minutes || 0
        return sum + hours + (minutes / 60)
    }, 0)
}

export function getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
}
