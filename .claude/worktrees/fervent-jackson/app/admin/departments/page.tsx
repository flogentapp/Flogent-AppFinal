import { createClient } from '@/lib/supabase/server'
import { DeptListClient } from '@/components/admin/DeptListClient'
import { Plus } from 'lucide-react'

export default async function DepartmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Access Denied</div>

    // 1. Fetch Departments
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name')

    // 2. Fetch Users (For the dropdown)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('status', 'active')
        .order('first_name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-gray-500 text-sm">Manage organization structure and leadership.</p>
                </div>
                
                {/* Placeholder for Create Button */}
                <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    <Plus className="w-4 h-4" />
                    New Department
                </button>
            </div>

            <DeptListClient 
                departments={departments || []} 
                users={users || []} 
            />
        </div>
    )
}