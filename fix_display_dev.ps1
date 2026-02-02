Write-Host "--- FIXING TIMESHEET DISPLAY (DEV) ---" -ForegroundColor Cyan

# Update: app/(timesheets)/timesheets/my/page.tsx
$pageContent = @"
import { createClient } from '@/lib/supabase/server'
import { WeekView } from '@/components/timesheets/WeekView'

export default async function TimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Please log in</div>

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

  // 1. Fetch Time Entries AND join the 'projects' table
  const { data: rawEntries } = await supabase
    .from('time_entries')
    .select('*, projects(name, code)') 
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })

  // 2. THE FIX: Rename 'projects' -> 'project'
  const entries = rawEntries?.map(e => ({
      ...e,
      date: e.entry_date, 
      hours: Number(e.hours) + (Number(e.minutes) / 60),
      project: e.projects  // <--- This connects the dots!
  }))

  // 3. Fetch list of active projects for the dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, code')
    .eq('tenant_id', profile?.tenant_id)
    .eq('status', 'active')
    .order('name')

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
"@

# Save to the specific Dev path
$path = "app\(timesheets)\timesheets\my\page.tsx"
$pageContent | Out-File -FilePath $path -Encoding UTF8
Write-Host "✅ Fixed: Frontend can now see Project Names." -ForegroundColor Green