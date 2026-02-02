import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Building2 } from 'lucide-react'
import { TeamManager } from '@/components/projects/TeamManager'
import { getProjectMembers, getAvailableUsers } from '@/lib/actions/members'

export default async function ProjectManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch Project Details
  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(name)')
    .eq('id', id)
    .single()

  if (!project) notFound()

  // 2. Fetch User Profile (for Tenant ID)
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

  // 3. Fetch Team Data
  const members = await getProjectMembers(id)
  const availableUsers = await getAvailableUsers(profile?.tenant_id)

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Button */}
        <Link 
            href="/admin/projects" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects List
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{project.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {project.code && <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{project.code}</span>}
                    <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> 
                        {project.clients ? project.clients.name : 'Internal Project'}
                    </span>
                    <span className={'px-2 py-0.5 rounded-full text-xs font-bold capitalize ' + (
                        project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    )}>
                        {project.status}
                    </span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">About this Project</h3>
                    <p className="text-gray-600 leading-relaxed">
                        {project.description || <span className="italic text-gray-400">No description provided.</span>}
                    </p>
                </div>
                
                {/* Stats / Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm font-medium">
                            <Clock className="w-4 h-4" /> Created At
                        </div>
                        <div className="font-semibold text-gray-900">
                            {new Date(project.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Team Management */}
            <div className="lg:col-span-1">
                <TeamManager 
                    projectId={project.id} 
                    members={members} 
                    availableUsers={availableUsers} 
                />
            </div>
        </div>

      </div>
    </div>
  )
}
