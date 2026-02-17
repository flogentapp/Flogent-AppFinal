'use client'

import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createTimeEntry } from '@/lib/actions/timesheets'
import { formatDate } from '@/lib/utils/dateHelpers'
import { useState, useEffect, useMemo } from 'react'
import { Clock, FileText, AlertCircle, Building2 } from 'lucide-react'
import { Switch } from '@headlessui/react'

interface AddEntryModalProps {
    isOpen: boolean
    onClose: () => void
    date: Date | null
    projects: any[]
    companies?: any[]
    departments?: any[]
    defaultCompanyId?: string
}

export function AddEntryModal({ isOpen, onClose, date, projects, companies = [], departments = [], defaultCompanyId }: AddEntryModalProps) {
    const [pending, setPending] = useState(false)
    const [isAdditionalWork, setIsAdditionalWork] = useState(false)
    
    // Default to the first company if no default is provided
    const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompanyId || (companies.length > 0 ? companies[0].id : ''))

    useEffect(() => {
        if (isOpen) {
            setIsAdditionalWork(false)
            if (defaultCompanyId) setSelectedCompanyId(defaultCompanyId)
            else if (companies.length > 0) setSelectedCompanyId(companies[0].id)
        }
    }, [isOpen, defaultCompanyId, companies])

    const filteredProjects = useMemo(() => {
        if (!selectedCompanyId) return []
        return projects.filter(p => p.company_id === selectedCompanyId)
    }, [projects, selectedCompanyId])

    // Detect duplicate project names across ALL user projects for disambiguation
    const duplicateNames = useMemo(() => {
        const nameCount: Record<string, number> = {}
        for (const p of projects) {
            nameCount[p.name] = (nameCount[p.name] || 0) + 1
        }
        return new Set(Object.keys(nameCount).filter(n => nameCount[n] > 1))
    }, [projects])

    const getProjectDisplayName = (p: any) => {
        if (!duplicateNames.has(p.name)) {
            return p.code ? `${p.name} (${p.code})` : p.name
        }
        const dept = departments.find((d: any) => d.id === p.department_id)
        const company = companies.find((c: any) => c.id === p.company_id)
        const suffix = [dept?.name, company?.name].filter(Boolean).join(' - ')
        const label = suffix ? `${p.name} - ${suffix}` : p.name
        return p.code ? `${label} (${p.code})` : label
    }

    const handleSubmit = async (formData: FormData) => {
        setPending(true)
        if (isAdditionalWork) {
            formData.set('is_additional_work', 'true')
        }
        await createTimeEntry(formData)
        setPending(false)
        setIsAdditionalWork(false)
        onClose()
    }

    if (!date) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Add Entry • {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            }
        >
            <form action={handleSubmit} className="space-y-5 pt-2">
                <input type="hidden" name="date" value={formatDate(date)} />

                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                    
                    {/* COMPANY SELECTOR */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            Company
                        </label>
                        <div className="relative">
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-white p-3 appearance-none"
                            >
                                <option value="" disabled>Select Company...</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* PROJECT SELECTOR */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 block"></span>
                            Project
                        </label>
                        <div className="relative">
                            <select
                                name="project_id"
                                required
                                defaultValue=""
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-white p-3 appearance-none"
                            >
                                <option value="" disabled>
                                    {filteredProjects.length === 0 ? "No projects found" : "Select a project..."}
                                </option>
                                {filteredProjects.map(p => (
                                    <option key={p.id} value={p.id}>{getProjectDisplayName(p)}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Input
                            label="Hours Worked"
                            name="hours"
                            type="number"
                            step="0.25"
                            min="0"
                            required
                            placeholder="e.g. 7.5"
                            className="bg-white pl-4 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                            Work Description
                        </label>
                        <textarea
                            name="description"
                            className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-white min-h-[80px] p-3 transition-all"
                            placeholder="What did you work on today?"
                        />
                    </div>

                    <div className="pt-2 border-t border-gray-200/60">
                        <Switch.Group as="div" className="flex items-center justify-between">
                            <span className="flex flex-col">
                                <Switch.Label as="span" className="text-sm font-bold text-gray-900" passive>
                                    Additional Work
                                </Switch.Label>
                                <Switch.Description as="span" className="text-xs text-gray-500">
                                    Is this work outside of normal scope?
                                </Switch.Description>
                            </span>
                            <Switch
                                checked={isAdditionalWork}
                                onChange={setIsAdditionalWork}
                                className={`${isAdditionalWork ? 'bg-indigo-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`${isAdditionalWork ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                            </Switch>
                        </Switch.Group>

                        {isAdditionalWork && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-bold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Reason for Additional Work
                                </label>
                                <textarea
                                    name="additional_work_description"
                                    required={isAdditionalWork}
                                    className="block w-full rounded-xl border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm bg-indigo-50/30 min-h-[80px] p-3 transition-all placeholder-indigo-300"
                                    placeholder="Why is this classified as additional?"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        disabled={pending}
                        className="px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100"
                    >
                        {pending ? 'Saving...' : 'Save Entry'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}