'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns'
import { Download, Search, X, Users, FolderOpen, Calendar, List, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type Entry = {
  id: string
  date: string
  hours: number
  status: string
  description?: string
  is_additional_work?: boolean
  user_id: string
  profiles?: { first_name: string; last_name: string }
  projects?: { name: string; code?: string; departments?: { name: string } }
}

type ReportType = 'employee' | 'project' | 'weekly' | 'detail'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userName(entry: Entry) {
  return `${entry.profiles?.first_name ?? ''} ${entry.profiles?.last_name ?? ''}`.trim()
}

function projectName(entry: Entry) {
  return entry.projects?.name ?? 'Unassigned'
}

function deptName(entry: Entry) {
  return entry.projects?.departments?.name ?? 'Unassigned'
}

function weekLabel(dateStr: string) {
  const d = parseISO(dateStr)
  return `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsClient({ initialData }: { initialData: Entry[] }) {

  // Filters
  const [reportType, setReportType] = useState<ReportType>('employee')
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState('All')
  const [selectedUser, setSelectedUser] = useState('All')
  const [selectedDept, setSelectedDept] = useState('All')
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })

  // UI state for expandable rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // ── Filter options ──────────────────────────────────────────────────────────
  const options = useMemo(() => {
    const projects = new Set<string>()
    const users = new Set<string>()
    const depts = new Set<string>()

    initialData.forEach(item => {
      const p = projectName(item)
      const u = userName(item)
      const d = deptName(item)
      if (p) projects.add(p)
      if (u) users.add(u)
      if (d) depts.add(d)
    })

    return {
      projects: ['All', ...Array.from(projects).sort()],
      users: ['All', ...Array.from(users).sort()],
      depts: ['All', ...Array.from(depts).sort()],
    }
  }, [initialData])

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return initialData.filter(item => {
      const d = parseISO(item.date)
      const start = parseISO(dateRange.start)
      const end = parseISO(dateRange.end)
      if (!isWithinInterval(d, { start, end })) return false
      if (selectedProject !== 'All' && projectName(item) !== selectedProject) return false
      if (selectedUser !== 'All' && userName(item) !== selectedUser) return false
      if (selectedDept !== 'All' && deptName(item) !== selectedDept) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !item.description?.toLowerCase().includes(q) &&
          !projectName(item).toLowerCase().includes(q) &&
          !userName(item).toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [initialData, search, selectedProject, selectedUser, selectedDept, dateRange])

  const totalHours = filtered.reduce((s, e) => s + (Number(e.hours) || 0), 0)

  const toggle = (key: string) => {
    const next = new Set(expanded)
    next.has(key) ? next.delete(key) : next.add(key)
    setExpanded(next)
  }

  // ── Excel export ────────────────────────────────────────────────────────────
  function exportExcel() {
    const wb = XLSX.utils.book_new()

    if (reportType === 'employee') {
      const rows = buildEmployeeRows(filtered)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'By Employee')
    } else if (reportType === 'project') {
      const rows = buildProjectRows(filtered)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'By Project')
    } else if (reportType === 'weekly') {
      const rows = buildWeeklyRows(filtered)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Weekly Summary')
    } else {
      const rows = buildDetailRows(filtered)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Detailed Log')
    }

    const filename = `flogent-report-${reportType}-${dateRange.start}-to-${dateRange.end}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  // ── Report type tabs ────────────────────────────────────────────────────────
  const tabs: { key: ReportType; label: string; icon: React.ElementType }[] = [
    { key: 'employee', label: 'By Employee', icon: Users },
    { key: 'project', label: 'By Project', icon: FolderOpen },
    { key: 'weekly', label: 'Weekly Summary', icon: Calendar },
    { key: 'detail', label: 'Detailed Log', icon: List },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Timesheet Reports</h1>
          <p className="text-gray-500 text-sm font-medium">Export and analyse your team's logged time.</p>
        </div>
        <div className="flex items-center gap-6 bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Hours</div>
            <div className="text-3xl font-black text-indigo-600 leading-none">
              {totalHours.toFixed(1)}<span className="text-xs ml-0.5 opacity-40">h</span>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Entries</div>
            <div className="text-3xl font-black text-gray-900 leading-none">{filtered.length}</div>
          </div>
          <button
            onClick={exportExcel}
            className="ml-2 flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-100"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Report type selector ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = reportType === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setReportType(tab.key); setExpanded(new Set()) }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">From</label>
            <Input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="rounded-xl bg-slate-50 border-transparent" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">To</label>
            <Input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="rounded-xl bg-slate-50 border-transparent" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Department</label>
            <select className="w-full h-10 px-3 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
              {options.depts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Project</label>
            <select className="w-full h-10 px-3 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              {options.projects.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 pt-4 border-t border-slate-50">
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Employee</label>
            <select className="w-full h-10 px-3 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              {options.users.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Project, name, description..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Report view ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[2rem] border border-dashed border-slate-200">
          <X className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No entries match the current filters.</p>
        </div>
      ) : (
        <>
          {reportType === 'employee' && <EmployeeReport data={filtered} expanded={expanded} toggle={toggle} />}
          {reportType === 'project' && <ProjectReport data={filtered} expanded={expanded} toggle={toggle} />}
          {reportType === 'weekly' && <WeeklyReport data={filtered} expanded={expanded} toggle={toggle} />}
          {reportType === 'detail' && <DetailReport data={filtered} />}
        </>
      )}
    </div>
  )
}

// ─── Report: By Employee ──────────────────────────────────────────────────────

function EmployeeReport({ data, expanded, toggle }: { data: Entry[]; expanded: Set<string>; toggle: (k: string) => void }) {
  const groups = useMemo(() => {
    const map: Record<string, { name: string; total: number; entries: Entry[] }> = {}
    data.forEach(e => {
      const uid = e.user_id
      if (!map[uid]) map[uid] = { name: userName(e), total: 0, entries: [] }
      map[uid].total += e.hours
      map[uid].entries.push(e)
    })
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total)
  }, [data])

  return (
    <div className="space-y-3">
      {groups.map(g => (
        <div key={g.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => toggle(g.id)} className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-100">
                {g.name.charAt(0)}
              </div>
              <div>
                <div className="font-black text-slate-900">{g.name}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{g.entries.length} entries</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total</div>
                <div className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{g.total.toFixed(1)}h</div>
              </div>
              {expanded.has(g.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expanded.has(g.id) && (
            <div className="border-t border-slate-50 px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <EntryTable entries={g.entries} showEmployee={false} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Report: By Project ───────────────────────────────────────────────────────

function ProjectReport({ data, expanded, toggle }: { data: Entry[]; expanded: Set<string>; toggle: (k: string) => void }) {
  const groups = useMemo(() => {
    const map: Record<string, { name: string; dept: string; total: number; entries: Entry[] }> = {}
    data.forEach(e => {
      const pid = e.projects?.name ?? 'unassigned'
      if (!map[pid]) map[pid] = { name: projectName(e), dept: deptName(e), total: 0, entries: [] }
      map[pid].total += e.hours
      map[pid].entries.push(e)
    })
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total)
  }, [data])

  return (
    <div className="space-y-3">
      {groups.map(g => (
        <div key={g.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => toggle(g.id)} className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-violet-100">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="font-black text-slate-900">{g.name}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{g.dept}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total</div>
                <div className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">{g.total.toFixed(1)}h</div>
              </div>
              {expanded.has(g.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expanded.has(g.id) && (
            <div className="border-t border-slate-50 px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <EntryTable entries={g.entries} showEmployee={true} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Report: Weekly Summary ───────────────────────────────────────────────────

function WeeklyReport({ data, expanded, toggle }: { data: Entry[]; expanded: Set<string>; toggle: (k: string) => void }) {
  const weeks = useMemo(() => {
    const map: Record<string, { label: string; total: number; entries: Entry[] }> = {}
    data.forEach(e => {
      const wk = weekLabel(e.date)
      if (!map[wk]) map[wk] = { label: wk, total: 0, entries: [] }
      map[wk].total += e.hours
      map[wk].entries.push(e)
    })
    return Object.entries(map).map(([k, v]) => ({ id: k, ...v })).sort((a, b) => a.id.localeCompare(b.id))
  }, [data])

  return (
    <div className="space-y-3">
      {weeks.map(w => (
        <div key={w.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => toggle(w.id)} className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-emerald-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="font-black text-slate-900">{w.label}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{w.entries.length} entries across {new Set(w.entries.map(e => e.user_id)).size} people</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total</div>
                <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.total.toFixed(1)}h</div>
              </div>
              {expanded.has(w.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expanded.has(w.id) && (
            <div className="border-t border-slate-50 px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <EntryTable entries={w.entries} showEmployee={true} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Report: Detailed Log ─────────────────────────────────────────────────────

function DetailReport({ data }: { data: Entry[] }) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.date.localeCompare(a.date)), [data])

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Employee</th>
              <th className="px-6 py-4 text-left">Project</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-right">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map(e => (
              <tr key={e.id} className="text-sm hover:bg-slate-50/40 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">{format(parseISO(e.date), 'MMM d, yyyy')}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{userName(e)}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">{projectName(e)}</td>
                <td className="px-6 py-4 text-slate-500 font-medium">{deptName(e)}</td>
                <td className="px-6 py-4"><StatusBadge status={e.status} /></td>
                <td className="px-6 py-4 text-slate-400 italic text-xs max-w-xs truncate">{e.description || '-'}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">{Number(e.hours).toFixed(1)}h</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/70 border-t border-slate-100">
              <td colSpan={6} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{sorted.length} entries</td>
              <td className="px-6 py-4 text-right font-black text-indigo-600">{sorted.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Shared: Entry table (used inside expandable rows) ────────────────────────

function EntryTable({ entries, showEmployee }: { entries: Entry[]; showEmployee: boolean }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full">
        <thead>
          <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] border-b border-slate-50">
            <th className="px-4 py-3 text-left">Date</th>
            {showEmployee && <th className="px-4 py-3 text-left">Employee</th>}
            {!showEmployee && <th className="px-4 py-3 text-left">Project</th>}
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-right">Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map(e => (
            <tr key={e.id} className="text-sm hover:bg-slate-50/50">
              <td className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">{format(parseISO(e.date), 'MMM d, yyyy')}</td>
              {showEmployee && <td className="px-4 py-3 font-bold text-slate-900">{userName(e)}</td>}
              {!showEmployee && <td className="px-4 py-3 font-bold text-indigo-600">{projectName(e)}</td>}
              <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
              <td className="px-4 py-3 text-slate-400 italic text-xs max-w-xs truncate">{e.description || '-'}</td>
              <td className="px-4 py-3 text-right font-black text-slate-900">{Number(e.hours).toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Excel row builders ───────────────────────────────────────────────────────

function buildEmployeeRows(data: Entry[]) {
  // Group by employee then flatten with subtotals
  const map: Record<string, Entry[]> = {}
  data.forEach(e => {
    const k = userName(e)
    if (!map[k]) map[k] = []
    map[k].push(e)
  })

  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({
        Employee: name,
        Date: e.date,
        Project: projectName(e),
        Department: deptName(e),
        Status: e.status,
        Hours: Number(e.hours).toFixed(2),
        Description: e.description || '',
        'Additional Work': e.is_additional_work ? 'Yes' : 'No',
      })
    })
    rows.push({
      Employee: `TOTAL: ${name}`,
      Date: '',
      Project: '',
      Department: '',
      Status: '',
      Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2),
      Description: '',
      'Additional Work': '',
    })
    rows.push({})
  })
  return rows
}

function buildProjectRows(data: Entry[]) {
  const map: Record<string, Entry[]> = {}
  data.forEach(e => {
    const k = projectName(e)
    if (!map[k]) map[k] = []
    map[k].push(e)
  })

  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([proj, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({
        Project: proj,
        Department: deptName(e),
        Date: e.date,
        Employee: userName(e),
        Status: e.status,
        Hours: Number(e.hours).toFixed(2),
        Description: e.description || '',
        'Additional Work': e.is_additional_work ? 'Yes' : 'No',
      })
    })
    rows.push({
      Project: `TOTAL: ${proj}`,
      Department: '',
      Date: '',
      Employee: '',
      Status: '',
      Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2),
      Description: '',
      'Additional Work': '',
    })
    rows.push({})
  })
  return rows
}

function buildWeeklyRows(data: Entry[]) {
  const map: Record<string, Entry[]> = {}
  data.forEach(e => {
    const wk = weekLabel(e.date)
    if (!map[wk]) map[wk] = []
    map[wk].push(e)
  })

  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([wk, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({
        'ISO Week': wk,
        Date: e.date,
        Employee: userName(e),
        Project: projectName(e),
        Department: deptName(e),
        Status: e.status,
        Hours: Number(e.hours).toFixed(2),
        Description: e.description || '',
      })
    })
    rows.push({
      'ISO Week': `TOTAL: ${wk}`,
      Date: '',
      Employee: '',
      Project: '',
      Department: '',
      Status: '',
      Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2),
      Description: '',
    })
    rows.push({})
  })
  return rows
}

function buildDetailRows(data: Entry[]) {
  return [...data]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => ({
      Date: e.date,
      Employee: userName(e),
      Project: projectName(e),
      Department: deptName(e),
      Status: e.status,
      Hours: Number(e.hours).toFixed(2),
      Description: e.description || '',
      'Additional Work': e.is_additional_work ? 'Yes' : 'No',
    }))
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    submitted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
    draft: 'bg-slate-50 text-slate-500 border-slate-100',
  }
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  )
}