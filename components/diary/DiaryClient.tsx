
'use client'

import React, { useState } from 'react'
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
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TemplateManager } from './TemplateManager'
import { DiaryEntryForm } from './DiaryEntryForm'
import { ComplianceDashboard } from './ComplianceDashboard'
import { cn } from '@/lib/utils'
import { format, addDays, subDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DiaryClient({
    initialTemplates,
    initialEntry,
    compliance,
    isCEO,
    currentUser,
    selectedDate,
    allUsers
}: any) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'diary' | 'compliance' | 'setup'>(isCEO && !initialEntry ? 'compliance' : 'diary')
    const [templates, setTemplates] = useState(initialTemplates)

    const handleDateChange = (newDate: string) => {
        router.push(`/diary?date=${newDate}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ClipboardCheck className="w-8 h-8 text-indigo-600" />
                        Daily Diary
                    </h1>
                    <p className="text-slate-500 font-semibold italic text-sm">Professional operational standards and daily reporting.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDateChange(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                        className="rounded-xl hover:bg-slate-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 px-4 py-2 font-black text-slate-700 bg-slate-50 rounded-xl">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        {format(new Date(selectedDate), 'EEEE, MMM do')}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDateChange(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                        className="rounded-xl hover:bg-slate-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 p-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl w-fit shadow-xl shadow-slate-200/50">
                <button
                    onClick={() => setActiveTab('diary')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        activeTab === 'diary' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    My Diary
                </button>
                {isCEO && (
                    <>
                        <button
                            onClick={() => setActiveTab('compliance')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'compliance' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Operations Hub
                        </button>
                        <button
                            onClick={() => setActiveTab('setup')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                activeTab === 'setup' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            Standard Setup
                        </button>
                    </>
                )}
            </div>

            {/* CONTENT */}
            <div className="mt-6">
                {activeTab === 'diary' && (
                    <div className="max-w-3xl mx-auto">
                        {templates.length === 0 ? (
                            <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100">
                                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-900">No Professional Standards Set</h3>
                                <p className="text-slate-500 font-semibold italic max-w-sm mx-auto mt-2">
                                    The CEO hasn't set up the daily operational requirements yet.
                                </p>
                            </div>
                        ) : (
                            <DiaryEntryForm
                                templates={templates}
                                initialEntry={initialEntry}
                                selectedDate={selectedDate}
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
                        onTemplateCreated={(newTemplate: any) => setTemplates([newTemplate, ...templates])}
                    />
                )}
            </div>
        </div>
    )
}
