'use client'

import React, { useState } from 'react'
import {
    Plus, Trash2, GripVertical, Save, Layout, Type, CheckSquare, Hash,
    Star, LayoutDashboard, Settings, LayoutTemplate, Sparkles,
    ChevronRight, X, Edit2, Archive, HelpCircle, AlertCircle,
    Clock, List, Tag, Eye, Info, ShieldAlert, Thermometer, Droplets,
    Zap, Utensils, Construction, Car, Laptop, Heart, Waves, Circle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createDiaryTemplate, updateDiaryTemplate, deleteDiaryTemplate, toggleTemplateStatus } from '@/lib/actions/diary'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const FIELD_ICONS = [
    { id: 'check', icon: CheckSquare },
    { id: 'zap', icon: Zap },
    { id: 'shield', icon: ShieldAlert },
    { id: 'alert', icon: AlertCircle },
    { id: 'thermometer', icon: Thermometer },
    { id: 'droplets', icon: Droplets },
    { id: 'utensils', icon: Utensils },
    { id: 'construction', icon: Construction },
    { id: 'laptop', icon: Laptop },
    { id: 'heart', icon: Heart },
    { id: 'waves', icon: Waves },
    { id: 'tag', icon: Tag },
    { id: 'info', icon: Info },
    { id: 'camera', icon: Eye },
]

const ACCENT_COLORS = [
    { id: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50', shadow: 'shadow-indigo-500/20' },
    { id: 'rose', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', shadow: 'shadow-rose-500/20' },
    { id: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', light: 'bg-emerald-50', shadow: 'shadow-emerald-500/20' },
    { id: 'amber', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', light: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
    { id: 'violet', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', light: 'bg-violet-50', shadow: 'shadow-violet-500/20' },
    { id: 'slate', bg: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-900', light: 'bg-slate-100', shadow: 'shadow-slate-500/20' },
]

export function TemplateManager({ templates, onTemplateCreated }: any) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [expandedField, setExpandedField] = useState<string | null>(null)
    const [accentColor, setAccentColor] = useState('indigo')
    const [fields, setFields] = useState<any[]>([
        { id: Math.random().toString(), label: '', type: 'checkbox', required: true, icon: 'check', options: [], helpText: '', isCritical: false }
    ])

    const addField = (type: string = 'checkbox') => {
        const id = Math.random().toString()
        setFields([...fields, {
            id,
            label: type === 'header' ? 'Section Header' : '',
            type,
            required: type !== 'header',
            icon: type === 'header' ? null : 'check',
            helpText: '',
            isCritical: false,
            options: type === 'select' ? ['Option 1', 'Option 2'] : []
        }])
        setExpandedField(id)
    }

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id))
    }

    const updateField = (id: string, updates: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const openCreate = () => {
        setEditingTemplate(null)
        setAccentColor('indigo')
        setFields([{ id: Math.random().toString(), label: '', type: 'checkbox', required: true, icon: 'check', options: [] }])
        setIsAddOpen(true)
    }

    const openEdit = (template: any) => {
        setEditingTemplate(template)
        setAccentColor(template.accent_color || 'indigo')
        setFields(template.fields.map((f: any) => ({
            ...f,
            icon: f.icon || (f.type === 'header' ? null : 'check'),
            options: f.options || []
        })))
        setIsAddOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you certain? This will delete the protocol permanently.')) return
        const res = await deleteDiaryTemplate(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Protocol eliminated.')
            onTemplateCreated(null) // Trigger refresh
        }
    }

    const handleToggleStatus = async (id: string, current: boolean) => {
        const res = await toggleTemplateStatus(id, !current)
        if (res.error) toast.error(res.error)
        else {
            toast.success(current ? 'Protocol Archived' : 'Protocol Restored')
            onTemplateCreated(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (fields.some(f => !f.label.trim())) {
            toast.error('Missing Instruction Name: Please provide a label for every checkpoint.')
            return
        }

        setIsSubmitting(true)
        formData.append('fields', JSON.stringify(fields))
        formData.append('accentColor', accentColor)

        try {
            let res
            if (editingTemplate) {
                res = await updateDiaryTemplate(editingTemplate.id, formData)
            } else {
                res = await createDiaryTemplate(formData)
            }

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(editingTemplate ? 'Protocol Synchronized!' : 'Operational Standard Protocol Active!')
                // @ts-ignore
                onTemplateCreated(editingTemplate ? null : res.data)
                setIsAddOpen(false)
            }
        } catch (err: any) {
            console.error('Fatal deployment error:', err)
            toast.error(err.message || 'Deployment failure')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-indigo-600" />
                        Professional Standards
                    </h2>
                    <p className="text-slate-500 font-semibold text-sm italic mt-1">Define elite operational protocols with granular precision.</p>
                </div>
                <Button onClick={openCreate} className="rounded-2xl px-8 py-6 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100 group">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> New Protocol
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((t: any, idx: number) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        key={t.id}
                        className={cn(
                            "group bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden flex flex-col",
                            !t.is_active && "opacity-60 grayscale"
                        )}
                    >
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors uppercase">{t.title}</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{t.fields.length} Checkpoints</span>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <button onClick={() => openEdit(t)} className="p-3 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-indigo-600 transition-all">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleToggleStatus(t.id, t.is_active)} className="p-3 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-amber-600 transition-all">
                                    <Archive className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="p-3 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <p className="text-slate-500 text-sm font-semibold italic flex-1 mb-8 leading-relaxed">
                            {t.description || 'No specific operational description provided.'}
                        </p>

                        <div className="space-y-3 relative z-10">
                            {t.fields.slice(0, 3).map((f: any) => (
                                <div key={f.id} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-2 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                    {f.type === 'header' ? <Layout className="w-3 h-3 text-indigo-400" /> : <ChevronRight className="w-3 h-3 text-indigo-400" />}
                                    <span className="truncate">{f.label}</span>
                                </div>
                            ))}
                            {t.fields.length > 3 && (
                                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest text-right pr-2">
                                    +{t.fields.length - 3} Additional Requirements
                                </div>
                            )}
                        </div>

                        {/* HOVER GLOW */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 blur-[40px] rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                    </motion.div>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6">
                            <Layout className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Operating Procedures</h3>
                        <p className="text-slate-400 font-semibold italic mt-2 max-w-sm">Define your first professional standard to begin tracking operational compliance.</p>
                        <Button onClick={openCreate} className="mt-8 rounded-2xl px-10 py-6 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100">
                            Assemble First Protocol
                        </Button>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} size="xl">
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {editingTemplate ? 'Modify Protocol' : 'Define Protocol'}
                            </h2>
                            <p className="text-slate-400 font-semibold text-sm italic">Architect your standards with premium customizability.</p>
                        </div>
                        <button onClick={() => setIsAddOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-900 tracking-wider ml-1">Protocol Title</label>
                                <Input
                                    name="title"
                                    defaultValue={editingTemplate?.title}
                                    placeholder="e.g., Daily Compliance Sign-off"
                                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-5 text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-0 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-900 tracking-wider ml-1">Operating Objective</label>
                                <Input
                                    name="description"
                                    defaultValue={editingTemplate?.description}
                                    placeholder="Explain the purpose of this standard..."
                                    className="h-14 rounded-2xl bg-white border-2 border-slate-100 px-5 text-base font-medium text-slate-600 focus:border-slate-900 focus:ring-0 transition-all"
                                />
                            </div>
                        </div>

                        {/* ACCENT COLOR PICKER */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <label className="text-xs font-bold uppercase text-slate-900 tracking-wider mb-4 block">Visual Branding</label>
                            <div className="flex flex-wrap gap-3">
                                {ACCENT_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setAccentColor(c.id)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                                            accentColor === c.id ? "border-slate-900 scale-110 shadow-lg" : "border-white hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn("w-6 h-6 rounded-md", c.bg)} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-1">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">Standard Operating Procedures</h3>
                                    <p className="text-xs font-medium text-slate-500 italic">Build the individual checkpoints for this protocol</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => addField('header')} className="h-10 px-4 rounded-xl border-2 border-slate-100 font-bold text-xs hover:bg-slate-50">
                                        <Layout className="w-4 h-4 mr-2" /> Section
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addField('checkbox')} className="h-10 px-4 rounded-xl border-2 border-slate-900 bg-slate-900 text-white font-bold text-xs hover:bg-black">
                                        <Plus className="w-4 h-4 mr-2" /> Add Step
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence initial={false}>
                                    {fields.map((field, index) => {
                                        const isExpanded = expandedField === field.id
                                        const FieldIcon = FIELD_ICONS.find(i => i.id === field.icon)?.icon || Circle
                                        const activeColor = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0]

                                        return (
                                            <motion.div
                                                key={field.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "rounded-2xl border-2 transition-all overflow-hidden",
                                                    isExpanded ? "border-slate-900 bg-white ring-4 ring-slate-100 shadow-xl" : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                                                )}
                                            >
                                                <div className="flex gap-3 items-center p-3">
                                                    <div className="p-2 cursor-grab text-slate-300">
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>

                                                    {field.type !== 'header' && (
                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0", isExpanded ? activeColor.bg + " text-white" : "bg-white text-slate-900 border border-slate-100")}>
                                                            <FieldIcon className="w-5 h-5" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <input
                                                            value={field.label}
                                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                            placeholder={field.type === 'header' ? "SECTION NAME (e.g., SITE SAFETY)" : "Compliance instruction..."}
                                                            className={cn(
                                                                "w-full bg-transparent border-none px-2 h-10 focus:ring-0 text-sm transition-all",
                                                                field.type === 'header' ? "font-black uppercase tracking-widest text-slate-900 placeholder:text-slate-300" : "font-bold text-slate-700 placeholder:text-slate-300"
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedField(isExpanded ? null : field.id)}
                                                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isExpanded ? "bg-slate-900 text-white" : "hover:bg-slate-200 text-slate-400")}
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeField(field.id)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: 'auto' }}
                                                            exit={{ height: 0 }}
                                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                                                        >
                                                            <div className="p-6 space-y-8">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                    <div className="space-y-4">
                                                                        <label className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Entry Control Type</label>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {['checkbox', 'text', 'number', 'scale', 'select', 'photo'].map(t => (
                                                                                <button
                                                                                    key={t}
                                                                                    type="button"
                                                                                    onClick={() => updateField(field.id, { type: t, icon: t === 'photo' ? 'camera' : field.icon })}
                                                                                    className={cn(
                                                                                        "py-2 rounded-lg text-[10px] font-bold uppercase transition-all border-2",
                                                                                        field.type === t ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent text-slate-400 border-transparent hover:border-slate-200"
                                                                                    )}
                                                                                >
                                                                                    {t}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <label className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Visual Context (Icon)</label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {FIELD_ICONS.map(i => {
                                                                                const Icon = i.icon
                                                                                return (
                                                                                    <button
                                                                                        key={i.id}
                                                                                        type="button"
                                                                                        onClick={() => updateField(field.id, { icon: i.id })}
                                                                                        className={cn(
                                                                                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2",
                                                                                            field.icon === i.id ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "text-slate-400 border-transparent hover:border-slate-200"
                                                                                        )}
                                                                                    >
                                                                                        <Icon className="w-4 h-4" />
                                                                                    </button>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {field.type === 'select' && (
                                                                    <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                                        <div className="flex justify-between items-center">
                                                                            <label className="text-xs font-bold uppercase text-slate-900">Selection Options</label>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-[10px] font-bold h-7 hover:bg-slate-50"
                                                                                onClick={() => updateField(field.id, { options: [...(field.options || []), `New Option`] })}
                                                                            >
                                                                                <Plus className="w-3 h-3 mr-1" /> Add Choice
                                                                            </Button>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {(field.options || []).map((opt: string, optIdx: number) => (
                                                                                <div key={optIdx} className="flex gap-2">
                                                                                    <input
                                                                                        value={opt}
                                                                                        onChange={(e) => {
                                                                                            const newOpts = [...field.options]
                                                                                            newOpts[optIdx] = e.target.value
                                                                                            updateField(field.id, { options: newOpts })
                                                                                        }}
                                                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white"
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const newOpts = field.options.filter((_: any, i: number) => i !== optIdx)
                                                                                            updateField(field.id, { options: newOpts })
                                                                                        }}
                                                                                        className="p-2 text-slate-300 hover:text-rose-500"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Instructional Text (SOP)</label>
                                                                    <textarea
                                                                        value={field.helpText || ''}
                                                                        onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                                                                        placeholder="Provide clear guidance for the worker..."
                                                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-600 focus:border-slate-900 focus:ring-0 transition-all min-h-[80px]"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="relative inline-flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`req-${field.id}`}
                                                                                checked={field.required}
                                                                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                                            />
                                                                            <label htmlFor={`req-${field.id}`} className="ml-2 text-xs font-bold text-slate-900 cursor-pointer">Mandatory Sign-off</label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="relative inline-flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                id={`crit-${field.id}`}
                                                                                checked={field.isCritical}
                                                                                onChange={(e) => updateField(field.id, { isCritical: e.target.checked })}
                                                                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                                            />
                                                                            <label htmlFor={`crit-${field.id}`} className="ml-2 text-xs font-bold text-rose-600 cursor-pointer">High Risk Assessment</label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="h-12 px-8 rounded-xl font-bold text-slate-500">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 px-10 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Syncing...
                                    </div>
                                ) : (
                                    editingTemplate ? 'Update Protocol' : 'Deploy Protocol'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )
}
