
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { submitDiaryEntry } from '@/lib/actions/diary'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CheckCircle2, Save, Send, Clock, User, ClipboardList, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DiaryEntryForm({ templates, initialEntry, selectedDate }: any) {
    const [template, setTemplate] = useState(initialEntry?.template || templates[0])
    const [responses, setResponses] = useState<any>(initialEntry?.responses || {})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDate
    const isPast = format(new Date(), 'yyyy-MM-dd') > selectedDate

    useEffect(() => {
        if (initialEntry) {
            setResponses(initialEntry.responses)
            setTemplate(initialEntry.template)
        } else {
            setResponses({})
            setTemplate(templates[0])
        }
    }, [initialEntry, templates])

    const handleResponseChange = (fieldId: string, value: any) => {
        if (initialEntry && !isToday) return // Lock past entries
        setResponses({ ...responses, [fieldId]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (initialEntry && !isToday) return

        // Validate required fields
        const missingFields = template.fields.filter((f: any) => f.required && !responses[f.id])
        if (missingFields.length > 0) {
            toast.error(`Please complete: ${missingFields[0].label}`)
            return
        }

        setIsSubmitting(true)
        const res = await submitDiaryEntry(template.id, selectedDate, responses)
        setIsSubmitting(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Professional Standards Submitted for today!')
        }
    }

    const renderField = (field: any) => {
        const value = responses[field.id] || ''
        const disabled = initialEntry && !isToday

        switch (field.type) {
            case 'checkbox':
                return (
                    <label className={cn(
                        "flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all cursor-pointer group",
                        value === true ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-50 hover:border-indigo-100"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                            value === true ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 group-hover:border-indigo-500"
                        )}>
                            {value === true && <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <span className={cn(
                            "grow font-black text-sm tracking-tight",
                            value === true ? "text-emerald-700" : "text-slate-600 group-hover:text-indigo-700"
                        )}>
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                        </span>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={value === true}
                            disabled={disabled}
                            onChange={(e) => handleResponseChange(field.id, e.target.checked)}
                        />
                    </label>
                )
            case 'number':
                return (
                    <div className="space-y-4 p-5 bg-white rounded-[24px] border-2 border-slate-50 hover:border-indigo-100 transition-all">
                        <Input
                            label={field.label}
                            type="number"
                            value={value}
                            disabled={disabled}
                            onChange={(e) => handleResponseChange(field.id, e.target.value)}
                            placeholder="0"
                            className="bg-slate-50 shadow-none h-14 text-lg font-black"
                        />
                    </div>
                )
            case 'scale':
                return (
                    <div className="space-y-4 p-5 bg-white rounded-[24px] border-2 border-slate-50 hover:border-indigo-100 transition-all">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">{field.label}</label>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => handleResponseChange(field.id, num)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-black text-sm transition-all border-2",
                                        value === num ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            default:
                return (
                    <Textarea
                        label={field.label}
                        value={value}
                        disabled={disabled}
                        onChange={(e) => handleResponseChange(field.id, e.target.value)}
                        className="bg-slate-50 italic min-h-[120px] border-none text-base"
                        placeholder="Type your response here..."
                    />
                )
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Status */}
            <div className={cn(
                "p-6 rounded-[32px] border flex items-center justify-between gap-4",
                initialEntry ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl",
                        initialEntry ? "bg-emerald-100" : "bg-amber-100"
                    )}>
                        {initialEntry ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Clock className="w-6 h-6 text-amber-600" />}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 tracking-tight leading-none">
                            {initialEntry ? 'Operations Completed' : 'Pending Review'}
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                            {initialEntry ? `Signed off at ${format(new Date(initialEntry.created_at), 'p')}` : 'Standards must be acknowledged daily'}
                        </p>
                    </div>
                </div>
                {initialEntry && (
                    <div className="hidden md:flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                        <Save className="w-4 h-4" /> Locked Record
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 px-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Daily Compliance Requirements</h3>
                </div>
                {template.fields.map((field: any) => (
                    <div key={field.id}>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            {(!initialEntry || isToday) && (
                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-3xl px-12 py-8 font-black uppercase tracking-[0.15em] text-sm shadow-2xl shadow-indigo-200 group relative overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {isSubmitting ? (
                                <>
                                    <Clock className="w-5 h-5 animate-spin" />
                                    Recording Standads...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit Daily Sign-Off
                                </>
                            )}
                        </span>
                    </Button>
                </div>
            )}

            {isPast && !initialEntry && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-xs font-bold leading-tight uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    Warning: You are viewing a past date which was not signed off. This record is marked as incomplete in compliance.
                </div>
            )}
        </form>
    )
}

function AlertCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
