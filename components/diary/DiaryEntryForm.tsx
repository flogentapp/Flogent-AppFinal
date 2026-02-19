
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { submitDiaryEntry } from '@/lib/actions/diary'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
    CheckCircle2, Save, Send, Clock, User, ClipboardList, Info, AlertCircle,
    ChevronRight, Star, ArrowRight, Check, Zap, HelpCircle, ShieldAlert,
    Thermometer, Droplets, Utensils, Construction, Laptop, Heart, Waves, Tag,
    Circle, Layout, Camera, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const ICON_MAP: any = {
    check: CheckCircle2,
    zap: Zap,
    shield: ShieldAlert,
    alert: AlertCircle,
    thermometer: Thermometer,
    droplets: Droplets,
    utensils: Utensils,
    construction: Construction,
    laptop: Laptop,
    heart: Heart,
    waves: Waves,
    tag: Tag,
    info: Info,
    camera: Camera,
}

const ACCENT_COLOR_MAP: any = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50', shadow: 'shadow-indigo-500/20' },
    rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', shadow: 'shadow-rose-500/20' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', light: 'bg-emerald-50', shadow: 'shadow-emerald-500/20' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', light: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', light: 'bg-violet-50', shadow: 'shadow-violet-500/20' },
    slate: { bg: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-900', light: 'bg-slate-100', shadow: 'shadow-slate-500/20' },
}

export function DiaryEntryForm({ templates, initialEntries = [], selectedDate, onRefresh }: any) {
    const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id)
    const [showHelp, setShowHelp] = useState<string | null>(null)
    const template = templates.find((t: any) => t.id === activeTemplateId) || templates[0]
    const activeColor = ACCENT_COLOR_MAP[template?.accent_color || 'indigo']

    // Find the entry for this specific template
    const currentEntry = initialEntries.find((e: any) => e.template_id === template?.id)

    const [responses, setResponses] = useState<any>(currentEntry?.responses || {})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDate
    const isPast = format(new Date(), 'yyyy-MM-dd') > selectedDate

    useEffect(() => {
        if (currentEntry) {
            setResponses(currentEntry.responses)
        } else {
            setResponses({})
        }
    }, [currentEntry, activeTemplateId])

    const handleResponseChange = (fieldId: string, value: any) => {
        if (currentEntry && !isToday) return
        setResponses({ ...responses, [fieldId]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (currentEntry && !isToday) return

        const missingFields = template.fields.filter((f: any) => f.required && f.type !== 'header' && !responses[f.id])
        if (missingFields.length > 0) {
            toast.error(`Required: ${missingFields[0].label}`)
            return
        }

        setIsSubmitting(true)
        const res = await submitDiaryEntry(template.id, selectedDate, responses)
        setIsSubmitting(false)

        if (res.error) toast.error(res.error)
        else {
            toast.success('Professional Standards Recorded Successfully!')
            if (onRefresh) onRefresh()
        }
    }

    const renderField = (field: any) => {
        const value = responses[field.id]
        const disabled = currentEntry && !isToday
        const FieldIcon = ICON_MAP[field.icon] || Circle
        const isCritical = field.isCritical

        if (field.type === 'header') {
            return (
                <div className="pt-10 pb-4">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activeColor.light, activeColor.text)}>
                            <Layout className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{field.label}</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                    </div>
                </div>
            )
        }

        const commonWrapperClass = cn(
            "group relative p-6 rounded-3xl border-2 transition-all duration-300",
            field.isCritical && !value ? "border-rose-100 bg-rose-50/50" : "border-slate-100 bg-white",
            !field.isCritical && isToday && "hover:border-slate-300 shadow-sm",
            field.isCritical && value ? "border-emerald-100 bg-emerald-50/20" : ""
        )

        return (
            <div className={commonWrapperClass}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* ICON & LABEL */}
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0",
                            value ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : cn("bg-slate-100 text-slate-500", activeColor.light, activeColor.text)
                        )}>
                            <FieldIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={cn(
                                    "font-black text-base tracking-tight leading-tight block truncate uppercase",
                                    value ? "text-slate-900" : "text-slate-600"
                                )}>
                                    {field.label}
                                </span>
                                {field.required && (
                                    <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200">
                                        Mandatory
                                    </span>
                                )}
                                {field.isCritical && (
                                    <span className="px-2 py-1 rounded-md bg-rose-600 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1 shadow-md shadow-rose-200">
                                        <AlertCircle className="w-3 h-3" /> Critical Risk
                                    </span>
                                )}
                            </div>

                            {field.helpText && (
                                <button
                                    type="button"
                                    onClick={() => setShowHelp(showHelp === field.id ? null : field.id)}
                                    className="mt-2 flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold transition-all"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="text-xs italic underline decoration-dotted">View Field SOP</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* INPUTS BY TYPE */}
                    <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        {field.type === 'checkbox' && (
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleResponseChange(field.id, !value)}
                                className={cn(
                                    "px-8 h-14 rounded-2xl border-4 font-black uppercase tracking-widest text-xs transition-all",
                                    value
                                        ? "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-200"
                                        : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-300"
                                )}
                            >
                                {value ? "Verified" : "Sign Off"}
                            </button>
                        )}

                        {field.type === 'number' && (
                            <Input
                                type="number"
                                value={value || ''}
                                disabled={disabled}
                                onChange={(e) => handleResponseChange(field.id, e.target.value)}
                                className="h-14 w-full md:w-32 rounded-xl bg-slate-50 border-2 border-slate-100 font-black text-xl text-center focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                                placeholder="0.00"
                            />
                        )}

                        {field.type === 'scale' && (
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => handleResponseChange(field.id, s)}
                                        className={cn(
                                            "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
                                            value >= s ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-transparent text-slate-300 hover:border-slate-200"
                                        )}
                                    >
                                        <Star className={cn("w-4 h-4", value >= s && "fill-white")} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {field.type === 'select' && (
                            <select
                                value={value || ''}
                                disabled={disabled}
                                onChange={(e) => handleResponseChange(field.id, e.target.value)}
                                className="h-14 w-full md:w-48 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 transition-all"
                            >
                                <option value="">Select Option...</option>
                                {(field.options || []).map((o: any) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                        )}

                        {field.type === 'photo' && (
                            <div className={cn(
                                "h-14 px-6 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all cursor-pointer",
                                value ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-400"
                            )}>
                                <Camera className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-wider">Proof Photo</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* HELP OVERLAY */}
                <AnimatePresence>
                    {showHelp === field.id && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-5 pt-5 border-t border-slate-100 overflow-hidden"
                        >
                            <div className="bg-slate-900 text-white rounded-2xl p-6 flex gap-4 relative shadow-2xl">
                                <Info className="w-8 h-8 shrink-0 text-slate-400" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">SOP Guidance</span>
                                    <p className="text-sm font-medium leading-relaxed">{field.helpText}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TEXTAREA AT BOTTOM IF TEXT TYPE */}
                {field.type === 'text' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                        <Textarea
                            value={value || ''}
                            disabled={disabled}
                            onChange={(e) => handleResponseChange(field.id, e.target.value)}
                            placeholder="Provide professional details/narrative..."
                            className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-medium text-slate-700 focus:bg-white focus:border-slate-900 focus:ring-0 min-h-[100px] transition-all"
                        />
                    </motion.div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* SIDEBAR SELECTOR */}
            <aside className="w-full lg:w-72 shrink-0">
                <div className="sticky top-8 space-y-4">
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-widest px-2 mb-4">Protocols</h5>
                    <div className="space-y-2">
                        {templates.map((t: any) => {
                            const entry = initialEntries.find((e: any) => e.template_id === t.id)
                            const isActive = activeTemplateId === t.id
                            const tColor = ACCENT_COLOR_MAP[t.accent_color || 'indigo']
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTemplateId(t.id)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group",
                                        isActive
                                            ? "bg-white border-slate-900 shadow-xl shadow-slate-200"
                                            : "bg-transparent border-transparent hover:bg-slate-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                        entry ? "bg-emerald-600 text-white" : (isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500")
                                    )}>
                                        {entry ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "font-bold text-xs truncate uppercase tracking-tight",
                                            isActive ? "text-slate-900" : "text-slate-500"
                                        )}>
                                            {t.title}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* FORM SIDE */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-8">
                {/* STATUS BANNER */}
                <motion.div
                    key={`banner-${activeTemplateId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-8 rounded-[40px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden",
                        currentEntry
                            ? "bg-slate-900 text-white border-slate-800"
                            : "bg-white border-slate-900 text-slate-900 shadow-2xl shadow-slate-200"
                    )}
                >
                    <div className="flex items-center gap-6 relative z-10">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                            currentEntry ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"
                        )}>
                            {currentEntry ? <CheckCircle2 className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-[10px] font-black uppercase tracking-wider", currentEntry ? "text-slate-400" : "text-slate-500")}>Operating Standard</span>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight uppercase">
                                {template?.title}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                                {currentEntry
                                    ? `Authorized at ${format(new Date(currentEntry.created_at), 'p')}`
                                    : 'Awaiting Compliance Sign-off'}
                            </p>
                        </div>
                    </div>

                    {currentEntry && (
                        <div className="px-5 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                            Immutable Record Active
                        </div>
                    )}
                </motion.div>

                {/* FORM FIELDS */}
                <div className="space-y-4">
                    {template?.fields.map((field: any, idx: number) => (
                        <motion.div
                            key={`${activeTemplateId}-${field.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {renderField(field)}
                        </motion.div>
                    ))}
                </div>

                {/* ACTION BUTTON */}
                {(!currentEntry || isToday) && (
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-16 px-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200"
                        >
                            {isSubmitting ? "Processing..." : "Submit Compliance Report"}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    )
}

