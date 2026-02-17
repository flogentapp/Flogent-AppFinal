
'use client'

import React, { useState } from 'react'
import { Plus, Trash2, GripVertical, Save, Layout, Type, CheckSquare, Hash, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createDiaryTemplate } from '@/lib/actions/diary'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TemplateManager({ templates, onTemplateCreated }: any) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fields, setFields] = useState<any[]>([
        { id: Math.random().toString(), label: '', type: 'checkbox', required: true }
    ])

    const addField = () => {
        setFields([...fields, { id: Math.random().toString(), label: '', type: 'checkbox', required: true }])
    }

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id))
    }

    const updateField = (id: string, updates: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (fields.some(f => !f.label.trim())) {
            toast.error('Please fill in all standard labels')
            return
        }

        setIsSubmitting(true)
        formData.append('fields', JSON.stringify(fields))

        const res = await createDiaryTemplate(formData)
        setIsSubmitting(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Professional Standard Template Created!')
            onTemplateCreated(res.data)
            setIsAddOpen(false)
            setFields([{ id: Math.random().toString(), label: '', type: 'checkbox', required: true }])
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Standards</h2>
                <Button onClick={() => setIsAddOpen(true)} className="rounded-xl px-6 font-black uppercase tracking-wider text-xs">
                    <Plus className="w-5 h-5 mr-2" /> New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t: any) => (
                    <div key={t.id} className="group bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Layout className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 tracking-tight leading-none">{t.title}</h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.fields.length} Standards Defined</span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-semibold italic truncate mb-6">{t.description || 'No description provided.'}</p>

                        <div className="space-y-2">
                            {t.fields.slice(0, 3).map((f: any) => (
                                <div key={f.id} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="truncate">{f.label}</span>
                                </div>
                            ))}
                            {t.fields.length > 3 && (
                                <span className="text-[9px] font-black text-indigo-400 uppercase">+{t.fields.length - 3} more standards</span>
                            )}
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                        <Layout className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-900">No Templates Found</h3>
                        <p className="text-slate-400 font-semibold italic">Create your first operational standard template.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Define Professional Standards">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Template Title</label>
                            <Input name="title" placeholder="e.g., Daily Site Compliance" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Description</label>
                            <Input name="description" placeholder="Briefly describe what this covers..." />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black uppercase text-slate-900 tracking-widest">Required Checkpoints</label>
                            <Button type="button" variant="outline" size="sm" onClick={addField} className="text-[10px] font-black h-8 px-3 rounded-lg border-2 border-slate-100 hover:border-indigo-100">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start bg-slate-50 p-4 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                                    <div className="p-2 cursor-grab text-slate-300 group-hover:text-slate-400 pt-3">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={field.label}
                                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                placeholder="What is the requirement?"
                                                className="bg-white border-transparent focus:border-indigo-500 shadow-none h-11"
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateField(field.id, { type: e.target.value })}
                                                className="bg-white border-none rounded-xl text-sm font-semibold px-4 h-11 focus:ring-2 focus:ring-indigo-500 transition-all"
                                            >
                                                <option value="checkbox">✓ Checkbox</option>
                                                <option value="text">✎ Textbox</option>
                                                <option value="number"># Number</option>
                                                <option value="scale">Rating (1-5)</option>
                                            </select>
                                        </div>
                                    </div>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeField(field.id)}
                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all pt-3"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1 rounded-2xl font-black uppercase tracking-wider text-xs" onClick={() => setIsAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-indigo-100">
                            {isSubmitting ? 'Creating...' : 'Launch Template'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
