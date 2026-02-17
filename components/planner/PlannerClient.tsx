'use client'

import React, { useState, useMemo } from 'react'
import {
    Clock,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Trash2,
    Edit2,
    Calendar,
    User,
    ChevronDown,
    Loader2,
    CalendarDays,
    MessageSquare,
    Send,
    History,
    FileText,
    ArrowRightCircle,
    CheckCircle,
    Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import {
    updatePlannerTask,
    deletePlannerTask,
    addPlannerNote,
    createPlannerTask,
    setPlannerTaskWaiting
} from '@/lib/actions/planner'

export function PlannerClient({ tasks: initialTasks, projects, users, currentUser }: any) {
    const [tasks, setTasks] = useState(initialTasks)
    const [view, setView] = useState<'active' | 'completed'>('active')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterAssignee, setFilterAssignee] = useState<string | null>(null)

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isWaitingOpen, setIsWaitingOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)

    // Transition states
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Filtering logic
    const filteredTasks = useMemo(() => {
        return tasks.filter((t: any) => {
            const matchesView = view === 'active'
                ? (t.status !== 'Completed' && t.status !== 'Deleted')
                : (t.status === 'Completed' || t.status === 'Deleted')
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (t.assigned_to?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesAssignee = !filterAssignee || t.assigned_to_id === filterAssignee
            return matchesView && matchesSearch && matchesAssignee
        })
    }, [tasks, view, searchQuery, filterAssignee])

    const activeCount = tasks.filter((t: any) => t.status !== 'Completed' && t.status !== 'Deleted').length
    const completedCount = tasks.filter((t: any) => t.status === 'Completed' || t.status === 'Deleted').length

    const handleUpdateStatus = async (taskId: string, status: string) => {
        setProcessingId(taskId)
        const res = await updatePlannerTask(taskId, { status })
        setProcessingId(null)
        if (res.error) toast.error(res.error)
        else {
            toast.success(`Task moved to ${status}`)
            setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, status } : t))
            if (selectedTask?.id === taskId) {
                setSelectedTask({ ...selectedTask, status })
            }
        }
    }

    const handleDelete = async (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (!confirm('Are you sure you want to delete this task?')) return
        setProcessingId(taskId)
        const res = await deletePlannerTask(taskId)
        setProcessingId(null)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Task moved to deletion history')
            window.location.reload() // Re-fetch all to get deletion notes and metadata
        }
    }

    const openDetails = (task: any) => {
        setSelectedTask(task)
        setIsDetailOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Planner</h1>
                    <p className="text-slate-500 font-semibold italic text-sm">Schedule resources and track progress across projects.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                        <button
                            onClick={() => setView('active')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2",
                                view === 'active' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Active <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", view === 'active' ? "bg-indigo-500" : "bg-gray-100")}>{activeCount}</span>
                        </button>
                        <button
                            onClick={() => setView('completed')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2",
                                view === 'completed' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Completed <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", view === 'completed' ? "bg-indigo-500" : "bg-gray-100")}>{completedCount}</span>
                        </button>
                    </div>
                    <Button onClick={() => setIsAddOpen(true)} className="rounded-xl px-6 py-6 font-black uppercase tracking-wider text-xs shadow-xl shadow-indigo-100">
                        <Plus className="w-5 h-5 mr-2" /> New Task
                    </Button>
                </div>
            </div>

            {/* toolbar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects, people..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                        value={filterAssignee || ''}
                        onChange={(e) => setFilterAssignee(e.target.value || null)}
                    >
                        <option value="">All People</option>
                        {users.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Task List / Board */}
            <div className="grid grid-cols-1 gap-4">
                {view === 'active' ? (
                    filteredTasks.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                            <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-900">No tasks found</h3>
                            <p className="text-slate-400 font-semibold italic">Try adjusting your filters or create a new task.</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE CARD VIEW */}
                            <div className="md:hidden space-y-4">
                                {filteredTasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        onClick={() => openDetails(task)}
                                        className="group bg-white rounded-[24px] border border-slate-100 p-6 flex flex-col justify-between gap-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'Completed'); }}
                                                disabled={processingId === task.id}
                                                className="w-8 h-8 rounded-full border-2 border-slate-200 text-transparent flex items-center justify-center shrink-0 transition-all mt-1 hover:border-emerald-500 hover:text-emerald-500"
                                            >
                                                {processingId === task.id ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <CheckCircle2 className="w-5 h-5" />}
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                        task.status === 'New' ? "bg-blue-50 text-blue-600" :
                                                            task.status === 'Waiting' ? "bg-amber-50 text-amber-600" :
                                                                "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {task.status}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.project?.name}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {task.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                        <User className="w-3.5 h-3.5" />
                                                        {task.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'Unassigned'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP TABLE VIEW */}
                            <div className="hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-visible">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">PROJECT</th>
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">TASK</th>
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">NOTES</th>
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">ASSIGNED TO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredTasks.map((task: any) => (
                                            <tr
                                                key={task.id}
                                                onClick={() => openDetails(task)}
                                                className="group hover:bg-slate-50/50 transition-colors cursor-pointer relative"
                                            >
                                                <td className="px-8 py-8 align-top">
                                                    <span className="text-sm font-black text-slate-900">{task.project?.name}</span>
                                                </td>
                                                <td className="px-8 py-8 align-top max-w-md">
                                                    <div className="space-y-1">
                                                        <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{task.title}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                                task.status === 'New' ? "bg-blue-50 text-blue-600" :
                                                                    task.status === 'Waiting' ? "bg-amber-50 text-amber-600" :
                                                                        "bg-emerald-50 text-emerald-600"
                                                            )}>
                                                                {task.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 align-top">
                                                    <div className="relative group/note max-w-lg">
                                                        <p className="text-sm font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                                                            {task.notes?.[0] ? `: ${task.notes[0].text}` : 'No notes.'}
                                                        </p>

                                                        {/* HOVER PREVIEW BOX */}
                                                        {task.notes?.length > 0 && (
                                                            <div className="absolute top-0 left-0 z-50 w-[400px] p-6 bg-white border border-slate-200 rounded-[24px] shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/note:opacity-100 group-hover/note:translate-y-4 transition-all duration-200">
                                                                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                                                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Updates</span>
                                                                </div>
                                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                    {task.notes.map((n: any, i: number) => (
                                                                        <div key={i} className="space-y-1">
                                                                            <div className="text-[9px] font-black text-indigo-500 uppercase">{n.date}</div>
                                                                            <div className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                                                {n.text}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 align-top text-right">
                                                    <div className="flex flex-col items-end gap-3">
                                                        <span className="text-sm font-bold text-slate-600">
                                                            {task.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'Unassigned'}
                                                        </span>

                                                        {/* ACTION BUTTONS (Appear on row hover) */}
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'Completed'); }}
                                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Mark Done"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsWaitingOpen(true); }}
                                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                                title="Set Waiting"
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(task.id, e)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )
                ) : (
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Task</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Handled By</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <p className="text-sm font-bold text-slate-400 italic">No history available.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map((task: any) => (
                                            <tr
                                                key={task.id}
                                                onClick={() => openDetails(task)}
                                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 font-bold text-slate-900 text-sm group-hover:text-indigo-600">{task.title}</td>
                                                <td className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{task.project?.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                        task.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-black uppercase tracking-widest">
                                                    {task.status === 'Completed' ? (
                                                        <span className="text-emerald-700">{task.marked_done_by?.first_name || '-'}</span>
                                                    ) : (
                                                        <span className="text-red-700">{task.deleted_by?.first_name || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                    {task.status === 'Completed'
                                                        ? (task.completion_date ? format(new Date(task.completion_date), 'MMM d, p') : '-')
                                                        : (task.deleted_at ? format(new Date(task.deleted_at), 'MMM d, p') : '-')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task.id, 'New'); }}
                                                            className="text-indigo-600 hover:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-indigo-100 font-extrabold text-[10px] uppercase tracking-wider transition-all"
                                                        >
                                                            Restore
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <PlannerModals
                isAddOpen={isAddOpen}
                setIsAddOpen={setIsAddOpen}
                isWaitingOpen={isWaitingOpen}
                setIsWaitingOpen={setIsWaitingOpen}
                isDetailOpen={isDetailOpen}
                setIsDetailOpen={setIsDetailOpen}
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                projects={projects}
                users={users}
                handleUpdateStatus={handleUpdateStatus}
                handleDelete={handleDelete}
                setTasks={setTasks}
                tasks={tasks}
            />
        </div>
    )
}

function PlannerModals({
    isAddOpen, setIsAddOpen,
    isWaitingOpen, setIsWaitingOpen,
    isDetailOpen, setIsDetailOpen,
    selectedTask, setSelectedTask,
    projects, users,
    handleUpdateStatus, handleDelete,
    setTasks, tasks
}: any) {
    const [submitting, setSubmitting] = useState(false)
    const [noteText, setNoteText] = useState('')

    // Add Task Handler
    const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const res = await createPlannerTask(formData)
        setSubmitting(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Task created')
            setIsAddOpen(false)
            window.location.reload() // Re-fetch all
        }
    }

    // Set Waiting Handler
    const handleSetWaiting = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const waitDays = parseInt(formData.get('wait_days') as string)
        const note = formData.get('note') as string
        const sendEmail = formData.get('send_email') === 'on'

        const res = await setPlannerTaskWaiting(selectedTask.id, waitDays, note, sendEmail)

        setSubmitting(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success(sendEmail ? 'Task set to waiting & email reminder sent' : 'Task set to waiting')
            setIsWaitingOpen(false)
            window.location.reload()
        }
    }

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!noteText.trim()) return
        setSubmitting(true)
        const res = await addPlannerNote(selectedTask.id, noteText)
        setSubmitting(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Note added')
            setNoteText('')
            // Update local state for immediate feedback in detail modal
            const newNote = {
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
                text: noteText
            }
            const updatedTask = {
                ...selectedTask,
                notes: [newNote, ...(selectedTask.notes || [])]
            }
            setSelectedTask(updatedTask)
            setTasks(tasks.map((t: any) => t.id === selectedTask.id ? updatedTask : t))
        }
    }

    return (
        <>
            {/* TASK DETAIL MODAL (THE BIG ONE) */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={selectedTask?.title || 'Task Details'}
                size="lg"
            >
                {selectedTask && (
                    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                                <div className={cn(
                                    "inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight",
                                    selectedTask.status === 'New' ? "bg-blue-100 text-blue-700" :
                                        selectedTask.status === 'Waiting' ? "bg-amber-100 text-amber-700" :
                                            selectedTask.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                                                selectedTask.status === 'Deleted' ? "bg-red-100 text-red-700" :
                                                    "bg-indigo-100 text-indigo-700"
                                )}>
                                    {selectedTask.status}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project</span>
                                <div className="text-sm font-black text-slate-900 truncate">{selectedTask.project?.name}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Assigned To</span>
                                <div className="text-sm font-black text-slate-900 truncate">
                                    {selectedTask.assigned_to ? `${selectedTask.assigned_to.first_name} ${selectedTask.assigned_to.last_name}` : 'Unassigned'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Handled By</span>
                                <div className="text-sm font-black text-indigo-600 truncate">
                                    {selectedTask.status === 'Completed'
                                        ? (selectedTask.marked_done_by ? `${selectedTask.marked_done_by.first_name} ${selectedTask.marked_done_by.last_name}` : '-')
                                        : selectedTask.status === 'Deleted'
                                            ? (selectedTask.deleted_by ? `${selectedTask.deleted_by.first_name} ${selectedTask.deleted_by.last_name}` : '-')
                                            : '-'}
                                </div>
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-8">
                            {selectedTask.status !== 'Completed' && (
                                <>
                                    <Button
                                        onClick={() => handleUpdateStatus(selectedTask.id, 'Completed')}
                                        className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsWaitingOpen(true)}
                                        className="h-10 border-amber-200 text-amber-700 hover:bg-amber-50 font-black text-xs uppercase tracking-widest rounded-xl"
                                    >
                                        <Clock className="w-4 h-4 mr-2" /> Set Waiting
                                    </Button>
                                </>
                            )}
                            {selectedTask.status === 'Completed' && (
                                <Button
                                    onClick={() => handleUpdateStatus(selectedTask.id, 'New')}
                                    variant="outline"
                                    className="h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-black text-xs uppercase tracking-widest rounded-xl"
                                >
                                    <ArrowRightCircle className="w-4 h-4 mr-2" /> Restore Task
                                </Button>
                            )}
                            <div className="flex-1" />
                            <button
                                onClick={() => handleDelete(selectedTask.id)}
                                className="h-10 px-4 text-slate-400 hover:text-red-600 hover:bg-red-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4 mr-2 inline" /> Delete
                            </button>
                        </div>

                        {/* Notes / Activity Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-5 h-5 text-indigo-600" />
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">History & Notes</h4>
                            </div>

                            {/* Add Note Form */}
                            <form onSubmit={handleAddNote} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Add a progress update or note..."
                                        className="w-full bg-slate-50 border-none rounded-2xl text-sm font-semibold p-4 min-h-[80px] focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                    <Button
                                        disabled={!noteText.trim() || submitting}
                                        className="px-6 py-2 h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />} Post Update
                                    </Button>
                                </div>
                            </form>

                            {/* Notes List */}
                            <div className="space-y-4 pt-4 relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-50 -z-10" />
                                {selectedTask.notes?.length > 0 ? (
                                    selectedTask.notes.map((note: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 shrink-0 group-hover:border-indigo-200 transition-colors">
                                                {note.date}
                                            </div>
                                            <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm text-sm font-medium text-slate-600 leading-relaxed group-hover:border-indigo-100 group-hover:shadow-md transition-all">
                                                {note.text}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileText className="w-6 h-6 text-slate-200" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 italic">No notes have been added to this task.</p>
                                    </div>
                                )}

                                {/* System Events */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                                        <Info className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 py-1.5 px-1 truncate">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">System</span>
                                        <span className="text-[10px] font-bold text-slate-500">Created on {format(new Date(selectedTask.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ADD TASK MODAL */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Task">
                <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Task Title</label>
                        <Input name="title" placeholder="What needs to be done?" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Project</label>
                            <select name="project_id" className="w-full bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-3 focus:ring-2 focus:ring-indigo-500" required>
                                <option value="">Select Project</option>
                                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Due Date</label>
                            <Input name="start_by" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Assign To</label>
                        <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2">
                            {users.map((u: any) => (
                                <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                    <input type="checkbox" name="assigned_to_ids" value={u.id} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{u.first_name} {u.last_name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Initial Note</label>
                        <textarea name="note" className="w-full bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-indigo-500" placeholder="Optional details..."></textarea>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer">
                        <input
                            type="checkbox"
                            name="send_email"
                            id="send_task_email"
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="send_task_email" className="text-xs font-black uppercase text-slate-500 cursor-pointer select-none group-hover:text-indigo-700 transition-colors">
                            Notify assignees via email
                        </label>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                    </Button>
                </form>
            </Modal>

            {/* WAITING MODAL */}
            <Modal isOpen={isWaitingOpen} onClose={() => setIsWaitingOpen(false)} title="Set Task to Waiting">
                <form onSubmit={handleSetWaiting} className="space-y-6">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs text-amber-700 font-bold italic leading-relaxed">
                            How long should we wait before bringing this task back to your attention?
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Follow-up In</label>
                        <select name="wait_days" className="w-full bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-3 focus:ring-2 focus:ring-amber-500" required>
                            <option value="1">Tomorrow</option>
                            <option value="2">2 Days</option>
                            <option value="3">3 Days</option>
                            <option value="7">1 Week</option>
                            <option value="14">2 Weeks</option>
                            <option value="30">1 Month</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400">Reason for Waiting</label>
                        <textarea name="note" className="w-full bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-amber-500" required placeholder="Why are we waiting?"></textarea>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer">
                        <input
                            type="checkbox"
                            name="send_email"
                            id="send_email"
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="send_email" className="text-xs font-black uppercase text-slate-500 cursor-pointer select-none group-hover:text-amber-700 transition-colors">
                            Send me an email reminder
                        </label>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-amber-600 hover:bg-amber-700 active:bg-amber-800 border-none text-white shadow-xl shadow-amber-100">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
                    </Button>
                </form>
            </Modal>
        </>
    )
}
