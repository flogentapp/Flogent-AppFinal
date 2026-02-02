import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { createProject } from '@/lib/actions/admin'
import { ProjectsClient } from '@/components/admin/ProjectsClient'

export default async function ProjectsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    const currentCompanyId = user.user_metadata.current_company_id
    if (!currentCompanyId) return <div>Select a company first.</div>

    // Get Tenant ID
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    // 1. Fetch Departments (for dropdown)
    let departments: any[] = []
    if (tenantId) {
        const { data } = await supabase
            .from('departments')
            .select('id, name')
            .eq('tenant_id', tenantId)
            .order('name')
        departments = data || []
    }

    // 2. Fetch projects for company with Department Name
    const { data: projects } = await supabase
        .from('projects')
        .select('*, departments(name)') // Join to get department name
        .eq('company_id', currentCompanyId)
        .order('name')

    // 3. Fetch Users (for assignment modal)
    let users: any[] = []
    if (tenantId) {
        const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .order('first_name')
        users = data || []
    }

    return (
        <div className="space-y-6">

            {/* Create Project Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Project</h3>
                <form action={async (formData) => {
                    'use server'
                    await createProject(formData)
                }} className="flex flex-col md:flex-row gap-4 items-end">
                    <input type="hidden" name="company_id" value={currentCompanyId} />

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Project Name</label>
                        <input name="name" required className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="e.g. Website Redesign" />
                    </div>

                    <div className="w-full md:w-48">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Assign Department</label>
                        <select name="department_id" className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50 text-gray-700">
                            <option value="">Unassigned (Global)</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-32">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Code</label>
                        <input name="code" className="block w-full rounded-lg border-gray-200 text-sm p-2.5 bg-gray-50" placeholder="WEB-001" />
                    </div>

                    <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Create
                    </button>
                </form>
            </div>

            {/* Client Side List with Modal */}
            <ProjectsClient
                projects={projects || []}
                users={users}
                currentCompanyId={currentCompanyId}
            />
        </div>
    )
}
