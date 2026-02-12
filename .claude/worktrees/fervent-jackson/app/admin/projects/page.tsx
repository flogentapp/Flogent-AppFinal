import { createClient } from '@/lib/supabase/server'
import { Plus, Grid, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Action to create project
async function createProject(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const companyId = formData.get('company_id') as string

    if (!name || !companyId) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return

    await supabase.from('projects').insert({
        tenant_id: profile.tenant_id,
        company_id: companyId,
        name,
        code: code || null,
        status: 'active',
        requires_timesheet_approval: true // Default to true
    })
}

export default async function ProjectsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    const currentCompanyId = user.user_metadata.current_company_id
    if (!currentCompanyId) return <div>Select a company first.</div>

    // Fetch projects for company
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 text-sm">Create and manage projects for your company.</p>
                </div>
            </div>

            {/* Create Project Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Project</h3>
                <form action={createProject} className="flex gap-4 items-end">
                    <input type="hidden" name="company_id" value={currentCompanyId} />
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Project Name</label>
                        <input name="name" required className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="e.g. Website Redesign" />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Code</label>
                        <input name="code" className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="WEB-001" />
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project) => (
                    <div key={project.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Grid className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {project.status}
                            </span>
                        </div>
                        <h3 className="mt-3 font-bold text-gray-900">{project.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">{project.code || 'No Code'}</p>

                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                {project.requires_timesheet_approval ? 'Approvals Required' : 'No Approvals'}
                            </span>
                            <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700">Inactive</Button>
                        </div>
                    </div>
                ))}
                {projects?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">No projects found.</div>
                )}
            </div>
        </div>
    )
}
