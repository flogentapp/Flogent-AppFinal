import { createClient } from '@/lib/supabase/server'
import { WeekView } from '@/components/timesheets/WeekView'

export default async function TimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Please log in</div>

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, current_company_id, department_id')
    .eq('id', user.id)
    .single()

  const activeTenantId = profile?.tenant_id || (user as any).user_metadata?.tenant_id

  // 1. Fetch Time Entries AND join the 'projects' table
  let query = supabase
    .from('time_entries')
    .select('*, projects(name, code, company_id, department_id)')
    .eq('user_id', user.id)

  const { data: rawEntries } = await query.order('entry_date', { ascending: false })

  // 2. THE FIX: Rename 'projects' -> 'project'
  const entries = rawEntries?.map(e => ({
    ...e,
    date: e.entry_date,
    hours: Number(e.hours) + (Number(e.minutes) / 60),
    project: e.projects
  }))

  // 3. Fetch list of active projects for the dropdown
  let projectQuery = supabase
    .from('projects')
    .select('id, name, code')
    .eq('tenant_id', activeTenantId)
    .eq('status', 'active')

  if (profile?.department_id) {
    projectQuery = projectQuery.eq('department_id', profile.department_id)
  } else if (profile?.current_company_id) {
    projectQuery = projectQuery.eq('company_id', profile.current_company_id)
  }

  const { data: projects } = await projectQuery.order('name')

  return (
    <div className='h-[calc(100vh-4rem)] flex flex-col'>
      <div className='flex-1 p-6 overflow-auto'>
        <WeekView
          entries={entries || []}
          projects={projects || []}
          user={user}
        />
      </div>
    </div>
  )
}
