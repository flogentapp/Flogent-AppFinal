'use client'

import { useState, useMemo } from 'react'
import {
    Building2,
    Plus,
    ChevronRight,
    LayoutGrid,
    Briefcase,
    ArrowLeft,
    Save,
    Trash2,
    Settings
} from 'lucide-react'
import {
    updateCompany,
    createCompany,
    updateDepartment,
    createDepartment,
    updateProject,
    createProject,
    deleteProject
} from '@/lib/actions/admin'
import { toast } from 'sonner'

interface Company { id: string; name: string; code: string | null; status: string }
interface Department { id: string; name: string; description: string | null; company_id: string }
interface Project { id: string; name: string; code: string | null; status: string; department_id: string | null; company_id: string }
interface User { id: string; first_name: string; last_name: string; email: string }

interface OrgManagementProps {
    companies: Company[]
    departments: Department[]
    projects: Project[]
    users: User[]
}

type ViewState = {
    type: 'list' | 'company' | 'department' | 'project'
    id: string | null
}

export function CompaniesClient({ companies, departments, projects, users }: OrgManagementProps) {
    const [view, setView] = useState<ViewState>({ type: 'list', id: null })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Data filtering
    const selectedCompany = useMemo(() =>
        view.type !== 'list' ? companies.find(c => c.id === (view.type === 'company' ? view.id :
            view.type === 'department' ? departments.find(d => d.id === view.id)?.company_id :
                projects.find(p => p.id === view.id)?.company_id
        )) : null
        , [view, companies, departments, projects])

    const selectedDepartment = useMemo(() =>
        view.type === 'department' || view.type === 'project' ? departments.find(d => d.id === (view.type === 'department' ? view.id : projects.find(p => p.id === view.id)?.department_id)) : null
        , [view, departments, projects])

    const selectedProject = useMemo(() =>
        view.type === 'project' ? projects.find(p => p.id === view.id) : null
        , [view, projects])

    const companyDepts = useMemo(() =>
        selectedCompany ? departments.filter(d => d.company_id === selectedCompany.id) : []
        , [selectedCompany, departments])

    const deptProjects = useMemo(() =>
        selectedDepartment ? projects.filter(p => p.department_id === selectedDepartment.id) :
            selectedCompany ? projects.filter(p => p.company_id === selectedCompany.id && !p.department_id) : []
        , [selectedDepartment, selectedCompany, projects])

    // Actions
    async function handleAction(action: any, formData: FormData, successMsg: string) {
        setIsSubmitting(true)
        try {
            const res = await action(formData)
            if (res?.error) toast.error(res.error)
            else {
                toast.success(successMsg)
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // RENDER HELPERS
    const renderBreadcrumbs = () => (
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
            <button onClick={() => setView({ type: 'list', id: null })} className="hover:text-indigo-600 transition-colors">Tenancy</button>
            {selectedCompany && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <button onClick={() => setView({ type: 'company', id: selectedCompany.id })} className="hover:text-indigo-600 transition-colors">{selectedCompany.name}</button>
                </>
            )}
            {selectedDepartment && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <button onClick={() => setView({ type: 'department', id: selectedDepartment.id })} className="hover:text-indigo-600 transition-colors">{selectedDepartment.name}</button>
                </>
            )}
            {selectedProject && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-indigo-600">{selectedProject.name}</span>
                </>
            )}
        </div>
    )

    if (view.type === 'list') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <header>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Portfolio</h1>
                    <p className="text-slate-500 font-semibold">Manage all your legal entities and business units.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setView({ type: 'company', id: c.id })}
                            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-1">{c.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.code || 'No Code'}</p>

                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Management Portal</span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    ))}

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <Building2 className="w-10 h-10 text-slate-300 mb-4" />
                        <h3 className="text-sm font-black text-slate-600 mb-4">Add New Organization</h3>
                        <form action={async (formData) => { await handleAction(createCompany, formData, 'Company created successfully') }} className="w-full space-y-3">
                            <input name="name" required placeholder="Company Name" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                            <button className="w-full bg-indigo-600 text-white rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Create Company
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    if (view.type === 'company' && selectedCompany) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {renderBreadcrumbs()}

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView({ type: 'list', id: null })} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCompany.name}</h1>
                            <p className="text-slate-500 font-semibold uppercase text-xs tracking-widest">{selectedCompany.code}</p>
                        </div>
                    </div>
                </header>

                <div key={`company-${selectedCompany.id}`} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* EDIT COMPANY */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <Settings className="w-4 h-4 text-indigo-600" /> General Settings
                            </h3>
                            <form action={async (formData) => { await handleAction(updateCompany, formData, 'Settings updated') }} className="space-y-4">
                                <input type="hidden" name="id" value={selectedCompany.id || ''} />
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Formal Name</label>
                                    <input name="name" defaultValue={selectedCompany.name || ''} className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">System Code</label>
                                    <input name="code" defaultValue={selectedCompany.code || ''} className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none uppercase font-mono" />
                                </div>
                                <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* DEPARTMENTS LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm min-h-[400px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900">Departments</h3>
                                <span className="text-xs font-bold text-slate-400">{companyDepts.length} registered units</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {companyDepts.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setView({ type: 'department', id: d.id })}
                                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group"
                                    >
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <LayoutGrid className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-slate-900">{d.name}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Business Unit</div>
                                        </div>
                                    </button>
                                ))}

                                <div className="p-4 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3">Add Department</h4>
                                    <form action={async (formData) => { await handleAction(createDepartment, formData, 'Department created') }} className="flex gap-2">
                                        <input type="hidden" name="company_id" value={selectedCompany.id || ''} />
                                        <input name="name" placeholder="Name" required className="flex-1 bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                                        <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (view.type === 'department' && selectedDepartment) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {renderBreadcrumbs()}

                <header className="flex items-center gap-4">
                    <button onClick={() => setView({ type: 'company', id: selectedCompany?.id || null })} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedDepartment.name}</h1>
                        <p className="text-slate-500 font-semibold uppercase text-xs tracking-widest">Departmental Unit of {selectedCompany?.name}</p>
                    </div>
                </header>

                <div key={`dept-${selectedDepartment.id}`} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* EDIT DEPT */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <LayoutGrid className="w-4 h-4 text-indigo-600" /> Unit Details
                            </h3>
                            <form action={async (formData) => { await handleAction(updateDepartment, formData, 'Unit updated') }} className="space-y-4">
                                <input type="hidden" name="id" value={selectedDepartment.id || ''} />
                                <input type="hidden" name="company_id" value={selectedCompany?.id || ''} />
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Department Name</label>
                                    <input name="name" defaultValue={selectedDepartment.name || ''} className="w-full bg-slate-50 border-transparent rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                                </div>
                                <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Unit'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* PROJECTS LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm min-h-[400px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900">Projects</h3>
                                <span className="text-xs font-bold text-slate-400">{deptProjects.length} active initiatives</span>
                            </div>

                            <div className="space-y-4">
                                {deptProjects.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setView({ type: 'project', id: p.id })}
                                        className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-slate-900">{p.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.code || 'NO-CODE'}</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}

                                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-[28px] mt-8">
                                    <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">New Initiative</h4>
                                    <form action={async (formData) => { await handleAction(createProject, formData, 'Project created') }} className="flex flex-col sm:flex-row gap-4">
                                        <input type="hidden" name="company_id" value={selectedCompany?.id || ''} />
                                        <input type="hidden" name="department_id" value={selectedDepartment.id || ''} />
                                        <div className="flex-1">
                                            <input name="name" placeholder="Project Name" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                                        </div>
                                        <div className="w-full sm:w-32">
                                            <input name="code" placeholder="Code" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase font-mono" />
                                        </div>
                                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> Create
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (view.type === 'project' && selectedProject) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {renderBreadcrumbs()}

                <header className="flex items-center gap-4">
                    <button onClick={() => setView({ type: 'department', id: selectedDepartment?.id || null })} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedProject.name}</h1>
                        <p className="text-slate-500 font-semibold uppercase text-xs tracking-widest">Project Initiative</p>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto">
                    <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-100/50">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-50 rounded-[28px] flex items-center justify-center text-indigo-600">
                                    <Briefcase className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Edit Settings</h3>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedProject.id}</p>
                                </div>
                            </div>
                            <form action={async () => {
                                if (confirm('Are you sure you want to delete this project?')) {
                                    await deleteProject(selectedProject.id)
                                    setView({ type: 'department', id: selectedDepartment?.id || null })
                                }
                            }}>
                                <button className="p-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </form>
                        </div>

                        <form action={async (formData) => { await handleAction(updateProject, formData, 'Project metadata updated') }} className="space-y-8">
                            <input type="hidden" name="id" value={selectedProject.id || ''} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Display name</label>
                                    <input name="name" defaultValue={selectedProject.name || ''} className="w-full bg-slate-50 border-transparent rounded-[24px] p-5 text-sm font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">System Code</label>
                                    <input name="code" defaultValue={selectedProject.code || ''} className="w-full bg-slate-50 border-transparent rounded-[24px] p-5 text-sm font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none font-mono uppercase" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status</label>
                                <select name="status" defaultValue={selectedProject.status || 'active'} className="w-full bg-slate-50 border-transparent rounded-[24px] p-5 text-sm font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none appearance-none cursor-pointer">
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>

                            <button disabled={isSubmitting} className="w-full bg-indigo-600 text-white rounded-[24px] py-6 text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 mt-12 disabled:opacity-50">
                                <Save className="w-5 h-5" /> {isSubmitting ? 'Saving Metadata...' : 'Commit Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
