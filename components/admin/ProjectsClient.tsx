'use client'

import { useState } from 'react'
import { Grid, UserPlus } from 'lucide-react'
import { EditProjectSheet } from './EditProjectSheet'
import { AssignProjectUserModal } from './AssignProjectLeaderModal'
import { UserPermissions } from '@/lib/actions/permissions'

interface ProjectsClientProps {
    projects: any[]
    users: any[] // Added users prop
    currentCompanyId: string
    permissions: UserPermissions
}

export function ProjectsClient({ projects, users, currentCompanyId, permissions }: ProjectsClientProps) {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                    const canManage = permissions.isOwner ||
                        permissions.isCEO ||
                        (permissions.isDepartmentHead && permissions.managedDepartmentIds.includes(project.department_id)) ||
                        (permissions.isProjectLeader && permissions.managedProjectIds.includes(project.id));

                    return (
                        <div
                            key={project.id}
                            className="w-full text-left bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group hover:border-indigo-100"
                        >
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <Grid className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {project.status}
                                </span>
                            </div>

                            {/* Department Badge */}
                            <div className="mt-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                    {project.departments?.name || 'Unassigned'}
                                </span>
                            </div>

                            <button
                                onClick={() => setSelectedProject(project)}
                                className="text-left w-full mt-3 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors hover:underline decoration-indigo-600 decoration-2 underline-offset-2"
                            >
                                {project.name}
                            </button>
                            <p className="text-xs text-gray-500 font-mono mt-1">{project.code || 'No Code'}</p>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between w-full">
                                {canManage && (
                                    <button
                                        onClick={() => setAssignUserProject(project)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-all"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Add Member
                                    </button>
                                )}

                                <button
                                    onClick={() => setSelectedProject(project)}
                                    className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Edit Details →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <EditProjectSheet
                project={selectedProject}
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
            />

            {assignUserProject && (
                <AssignProjectUserModal
                    isOpen={!!assignUserProject}
                    onClose={() => setAssignUserProject(null)}
                    projectId={assignUserProject.id}
                    projectName={assignUserProject.name}
                    users={users}
                />
            )}
        </div>
    )
}
