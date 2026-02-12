'use client'

import { useState } from 'react'
import { logTime } from '@/lib/actions/timesheets'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Zap, Clock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function QuickTimeEntry({ projects }: { projects: any[] }) {
    const [loading, setLoading] = useState(false)
    const [selectedProject, setSelectedProject] = useState('')
    const [hours, setHours] = useState('')
    const router = useRouter()

    async function handleQuickAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedProject || !hours) return

        setLoading(true)
        const formData = new FormData()
        formData.append('project_id', selectedProject)
        formData.append('hours', hours)
        formData.append('date', new Date().toISOString().split('T')[0])
        formData.append('description', 'Quick entry from dashboard')

        const res = await logTime(formData)
        setLoading(false)

        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Time logged!')
            setHours('')
            router.refresh()
        }
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Zap className="w-5 h-5 fill-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Quick Log</h3>
                        <p className="text-xs text-slate-500 font-medium">Log time for today in one click</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                        required
                    >
                        <option value="">Select Project...</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-24">
                    <Input
                        type="number"
                        step="any"
                        placeholder="Hours"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-black text-indigo-600 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading || !selectedProject || !hours}
                    className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 font-black flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4 text-indigo-200" /> Log Time</>}
                </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-2">
                    {/* Suggested recent projects could go here */}
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/timesheets/my')}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 group/btn"
                >
                    Full Timesheet <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    )
}
