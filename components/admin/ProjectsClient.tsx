'use client'

import { useState } from 'react'
import { Grid, UserPlus } from 'lucide-react'
import { EditProjectSheet } from './EditProjectSheet'
import { AssignProjectUserModal } from './AssignProjectLeaderModal'
import type { UserPermissions } from '@/types/permissions'

interface ProjectsClientProps {
    projects: any[]
    users: any[] // Added users prop
    currentCompanyId: string
    permissions: UserPermissions
}

export function ProjectsClient({ projects, users, currentCompanyId, permissions }: ProjectsClientProps) {
    const [activeModal, setActiveModal] = useState<'edit' | 'assign' | null>(null)
    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [assignUserProject, setAssignUserProject] = useState<any>(null)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 text-sm">Create and manage projects for your company.</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* MOBILE CARDS */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {projects.map((project) => {
                        const canManage = permissions.isOwner ||
                            permissions.isCEO ||
                            (permissions.isDepartmentHead && permissions.managedDepartmentIds.includes(project.department_id)) ||
                            (permissions.isProjectLeader && permissions.managedProjectIds.includes(project.id));

                        return (
                            <div
                                key={project.id}
                                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                            <Grid className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
                                                {project.code || 'NO-CODE'}
                                            </div>
                                            <div className="font-black text-slate-900 leading-tight">{project.name}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {project.status}
                                    </span>
                                </div>

                                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Department</span>
                                        <span className="text-xs font-bold text-slate-700">{project.departments?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {canManage && (
                                            <button
                                                onClick={() => setAssignUserProject(project)}
                                                className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                                            >
                                                <UserPlus className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setSelectedProject(project); setActiveModal('edit'); }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP TABLE */}
                <div className='hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden'>
                    <table className='min-w-full divide-y divide-slate-100'>
                        <thead className='bg-slate-50/50'>
                            <tr>
                                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Project</th>
                                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Department</th>
                                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Code</th>
                                <th className='px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Status</th>
                                <th className='px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {projects.map((project) => {
                                const canManage = permissions.isOwner ||
                                    permissions.isCEO ||
                                    (permissions.isDepartmentHead && permissions.managedDepartmentIds.includes(project.department_id)) ||
                                    (permissions.isProjectLeader && permissions.managedProjectIds.includes(project.id));

                                return (
                                    <tr key={project.id} className='hover:bg-slate-50/50 transition-colors group'>
                                        <td className='px-8 py-5'>
                                            <div className='flex items-center gap-3'>
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Grid className="w-5 h-5" />
                                                </div>
                                                <div className='font-black text-slate-900 group-hover:text-indigo-600 transition-colors'>{project.name}</div>
                                            </div>
                                        </td>
                                        <td className='px-8 py-5'>
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] uppercase font-black tracking-tight border border-slate-200">
                                                {project.departments?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className='px-8 py-5 text-sm font-black text-slate-400 font-mono'>{project.code || '--'}</td>
                                        <td className='px-8 py-5 text-center'>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className='px-8 py-5 text-right'>
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canManage && (
                                                    <button
                                                        onClick={() => { setAssignUserProject(project); setActiveModal('assign'); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl hover:shadow-sm transition-all"
                                                        title="Add Member"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setSelectedProject(project); setActiveModal('edit'); }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditProjectSheet
                project={selectedProject}
                isOpen={activeModal === 'edit'}
                onClose={() => { setActiveModal(null); setSelectedProject(null); }}
            />

            <AssignProjectUserModal
                isOpen={activeModal === 'assign'}
                onClose={() => { setActiveModal(null); setAssignUserProject(null); }}
                projectId={assignUserProject?.id}
                projectName={assignUserProject?.name}
                users={users}
            />
        </div>
    )
}
