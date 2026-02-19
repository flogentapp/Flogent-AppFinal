
'use client'

import React, { useState, useEffect } from 'react'
import {
    ClipboardCheck,
    Settings,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Save,
    CheckCircle2,
    BarChart3,
    History,
    AlertCircle,
    LayoutDashboard,
    Zap,
    Users,
    ArrowRight,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TemplateManager } from './TemplateManager'
import { DiaryEntryForm } from './DiaryEntryForm'
import { ComplianceDashboard } from './ComplianceDashboard'
import { cn } from '@/lib/utils'
import { format, addDays, subDays, isToday as isDateToday } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getDiaryTemplates, getDailyDiaryEntries, getDiaryComplianceOverview } from '@/lib/actions/diary'

export function DiaryClient({
    initialTemplates,
    initialEntries,
    initialCompliance,
    isCEO,
    currentUser,
    selectedDate,
    allUsers
}: any) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<'diary' | 'compliance' | 'setup'>(
        isCEO && initialEntries.length === 0 ? 'compliance' : 'diary'
    )
    const [templates, setTemplates] = useState(initialTemplates)
    const [entries, setEntries] = useState(initialEntries)
    const [compliance, setCompliance] = useState(initialCompliance)
    const [isLoading, setIsLoading] = useState(false)

    const handleDateChange = (newDate: string) => {
        router.push(`/diary?date=${newDate}`)
    }

    const refreshData = async () => {
        setIsLoading(true)
        try {
            const [t, e, c] = await Promise.all([
                getDiaryTemplates(),
                getDailyDiaryEntries(selectedDate),
                isCEO ? getDiaryComplianceOverview(selectedDate) : Promise.resolve([])
            ])
            setTemplates(t)
            setEntries(e)
            setCompliance(c)
        } catch (error) {
            toast.error('Sync failed')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setEntries(initialEntries)
        setCompliance(initialCompliance)
        setTemplates(initialTemplates)
    }, [initialEntries, initialCompliance, initialTemplates])

    const tabs = [
        { id: 'diary', label: 'My Diary', icon: ClipboardCheck },
        ...(isCEO ? [
            { id: 'compliance', label: 'Operations Hub', icon: BarChart3 },
            { id: 'setup', label: 'Standard Setup', icon: Settings }
        ] : [])
    ]

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            {/* PREMIUM HEADER */}
            <header className="relative overflow-hidden pt-8 pb-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 relative z-10">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]"
                        >
                            <Zap className="w-3 h-3 fill-indigo-600" />
                            Operational Excellence
                            {isLoading && <Loader2 className="w-3 h-3 animate-spin ml-2" />}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4"
                        >
                            Daily Diary
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 font-semibold text-lg max-w-xl leading-relaxed"
                        >
                            Maintain high standards and track daily compliance across your operations.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-xl p-2 rounded-[32px] shadow-2xl shadow-indigo-500/10 border border-white"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDateChange(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                            className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>

                        <div className="px-6 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 min-w-[200px] justify-center">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    {isDateToday(new Date(selectedDate)) ? 'Today' : format(new Date(selectedDate), 'MMM yyyy')}
                                </span>
                                <span className="text-sm font-black text-slate-900">
                                    {format(new Date(selectedDate), 'EEEE, do')}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDateChange(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                            className="rounded-2xl h-12 w-12 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </motion.div>
                </div>

                {/* BACKGROUND DECOR */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/5 blur-[80px] rounded-full pointer-events-none" />
            </header>

            {/* NAVIGATION TABS */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "relative px-6 py-4 flex items-center gap-3 transition-all outline-none group",
                                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-indigo-600")} />
                            <span className="text-sm font-black uppercase tracking-widest">{tab.label}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* CONTENT AREA */}
            <main className="min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {activeTab === 'diary' && (
                            <div className="max-w-4xl mx-auto pt-4">
                                {templates.length === 0 ? (
                                    <div className="bg-white rounded-[48px] p-20 text-center border border-slate-100 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
                                        <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                            <AlertCircle className="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">No Active Standards</h3>
                                        <p className="text-slate-500 font-semibold italic max-w-md mx-auto mt-4 text-lg">
                                            Head over to the Setup tab to define your daily operational requirements.
                                        </p>
                                        <Button
                                            onClick={() => setActiveTab('setup')}
                                            className="mt-10 rounded-2xl px-10 py-6 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100 group"
                                        >
                                            Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                ) : (
                                    <DiaryEntryForm
                                        templates={templates}
                                        initialEntries={entries}
                                        selectedDate={selectedDate}
                                        onRefresh={refreshData}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'compliance' && isCEO && (
                            <ComplianceDashboard
                                compliance={compliance}
                                selectedDate={selectedDate}
                            />
                        )}

                        {activeTab === 'setup' && isCEO && (
                            <TemplateManager
                                templates={templates}
                                onTemplateCreated={(newTemplate: any) => refreshData()}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
