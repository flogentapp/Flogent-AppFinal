'use client'

import { SlideOver } from '@/components/ui/SlideOver'
import { Button } from '@/components/ui/Button'
import { updateProject, deleteProject } from '@/lib/actions/admin' // Added deleteProject
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

interface EditProjectSheetProps {
    project: any
    isOpen: boolean
    onClose: () => void
}

export function EditProjectSheet({ project, isOpen, onClose }: EditProjectSheetProps) {
    const [pending, setPending] = useState(false)
    const [deleting, setDeleting] = useState(false) // Deletion loading state

    if (!project) return null

    async function handleSubmit(formData: FormData) {
        setPending(true)
        try {
            const res = await updateProject(formData)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Project updated')
                onClose()
            }
        } catch {
            toast.error('Failed to update')
        } finally {
            setPending(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

        setDeleting(true)
        try {
            const res = await deleteProject(project.id)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Project deleted')
                onClose()
            }
        } catch {
            toast.error('Failed to delete project')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Project"
            footer={
                <div className="flex w-full justify-between">
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={deleting || pending}
                    >
                        {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete Project
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={deleting || pending}>Cancel</Button>
                        <Button form="edit-project-form" type="submit" disabled={pending || deleting}>
                            {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            }
        >
            <form id="edit-project-form" action={handleSubmit} className="space-y-6 pt-4">
                <input type="hidden" name="id" value={project.id} />

                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                        name="name"
                        defaultValue={project.name}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Code</label>
                    <input
                        name="code"
                        defaultValue={project.code}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        name="status"
                        defaultValue={project.status}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="requires_timesheet_approval"
                            name="requires_timesheet_approval"
                            type="checkbox"
                            defaultChecked={project.requires_timesheet_approval}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="requires_timesheet_approval" className="font-medium text-gray-900">
                            Timesheet Approval
                        </label>
                        <p className="text-gray-500">Require manager approval for time entries logged to this project.</p>
                    </div>
                </div>
            </form>
        </SlideOver>
    )
}
