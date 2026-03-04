'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getISOWeek, getYear } from 'date-fns'
import { Download, ChevronDown, ChevronUp, Users, FolderOpen, Calendar, List, X, Check } from 'lucide-react'
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

function userName(e: Entry) {
  return `${e.profiles?.first_name ?? ''} ${e.profiles?.last_name ?? ''}`.trim() || 'Unknown'
}
function projectName(e: Entry) { return e.projects?.name ?? 'Unassigned' }
function deptName(e: Entry) { return e.projects?.departments?.name ?? 'Unassigned' }
function weekLabel(dateStr: string) {
  const d = parseISO(dateStr)
  return `${getYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
}

// ─── Multi-select Dropdown ────────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  const allSelected = selected.length === 0
  const displayLabel = allSelected ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`

  return (
    <div ref={ref} className="relative">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between h-10 px-3 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
      >
        <span className={allSelected ? 'text-slate-400' : 'text-slate-800'}>{displayLabel}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[200px] bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-50 border-b border-slate-50 transition-colors"
            >
              <X className="w-3 h-3" /> Clear selection
            </button>
          )}
          <div className="max-h-60 overflow-y-auto">
            {options.map(opt => {
              const checked = selected.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold hover:bg-indigo-50 transition-colors ${checked ? 'text-indigo-700 bg-indigo-50/50' : 'text-slate-700'}`}
                >
                  <span>{opt}</span>
                  {checked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportsClient({ initialData }: { initialData: Entry[] }) {

  const [reportType, setReportType] = useState<ReportType>('employee')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })
  const [selEmployees, setSelEmployees] = useState<string[]>([])
  const [selProjects, setSelProjects] = useState<string[]>([])
  const [selDepts, setSelDepts] = useState<string[]>([])

  const options = useMemo(() => {
    const employees = new Set<string>()
    const projects = new Set<string>()
    const depts = new Set<string>()
    initialData.forEach(e => {
      employees.add(userName(e))
      projects.add(projectName(e))
      depts.add(deptName(e))
    })
    return {
      employees: Array.from(employees).sort(),
      projects: Array.from(projects).sort(),
      depts: Array.from(depts).sort(),
    }
  }, [initialData])

  const filtered = useMemo(() => {
    return initialData.filter(e => {
      const d = parseISO(e.date)
      if (!isWithinInterval(d, { start: parseISO(dateRange.start), end: parseISO(dateRange.end) })) return false
      if (selEmployees.length > 0 && !selEmployees.includes(userName(e))) return false
      if (selProjects.length > 0 && !selProjects.includes(projectName(e))) return false
      if (selDepts.length > 0 && !selDepts.includes(deptName(e))) return false
      return true
    })
  }, [initialData, dateRange, selEmployees, selProjects, selDepts])

  const totalHours = filtered.reduce((s, e) => s + (Number(e.hours) || 0), 0)
  const activeFilterCount = selEmployees.length + selProjects.length + selDepts.length

  const toggle = (key: string) => {
    const next = new Set(expanded)
    next.has(key) ? next.delete(key) : next.add(key)
    setExpanded(next)
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()

    const empRows = buildEmployeeRows(filtered)
    const ws1 = XLSX.utils.json_to_sheet(empRows)
    ws1['!autofilter'] = { ref: `A1:H${empRows.length + 1}` }
    XLSX.utils.book_append_sheet(wb, ws1, 'By Employee')

    const projRows = buildProjectRows(filtered)
    const ws2 = XLSX.utils.json_to_sheet(projRows)
    ws2['!autofilter'] = { ref: `A1:H${projRows.length + 1}` }
    XLSX.utils.book_append_sheet(wb, ws2, 'By Project')

    const weekRows = buildWeeklyRows(filtered)
    const ws3 = XLSX.utils.json_to_sheet(weekRows)
    ws3['!autofilter'] = { ref: `A1:H${weekRows.length + 1}` }
    XLSX.utils.book_append_sheet(wb, ws3, 'Weekly Summary')

    const detailRows = buildDetailRows(filtered)
    const ws4 = XLSX.utils.json_to_sheet(detailRows)
    ws4['!autofilter'] = { ref: `A1:H${detailRows.length + 1}` }
    XLSX.utils.book_append_sheet(wb, ws4, 'Detailed Log')

    XLSX.writeFile(wb, `flogent-report-${dateRange.start}-to-${dateRange.end}.xlsx`)
  }

  const tabs: { key: ReportType; label: string; icon: React.ElementType }[] = [
    { key: 'employee', label: 'By Employee', icon: Users },
    { key: 'project', label: 'By Project', icon: FolderOpen },
    { key: 'weekly', label: 'Weekly Summary', icon: Calendar },
    { key: 'detail', label: 'Detailed Log', icon: List },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
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

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Filters</div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setSelEmployees([]); setSelProjects([]); setSelDepts([]) }}
              className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From</div>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-transparent text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-200 transition-all"
            />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">To</div>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-transparent text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-200 transition-all"
            />
          </div>
          <MultiSelect label="Employee" options={options.employees} selected={selEmployees} onChange={setSelEmployees} />
          <MultiSelect label="Project" options={options.projects} selected={selProjects} onChange={setSelProjects} />
          <MultiSelect label="Department" options={options.depts} selected={selDepts} onChange={setSelDepts} />
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
            {[
              ...selEmployees.map(v => ({ type: 'Employee', value: v, clear: () => setSelEmployees(p => p.filter(x => x !== v)) })),
              ...selProjects.map(v => ({ type: 'Project', value: v, clear: () => setSelProjects(p => p.filter(x => x !== v)) })),
              ...selDepts.map(v => ({ type: 'Dept', value: v, clear: () => setSelDepts(p => p.filter(x => x !== v)) })),
            ].map((chip, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-700">
                <span className="text-indigo-400">{chip.type}:</span> {chip.value}
                <button onClick={chip.clear} className="ml-1 text-indigo-400 hover:text-indigo-700 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report type tabs */}
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

      {/* Report content */}
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

// ─── By Employee ──────────────────────────────────────────────────────────────

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

// ─── By Project ───────────────────────────────────────────────────────────────

function ProjectReport({ data, expanded, toggle }: { data: Entry[]; expanded: Set<string>; toggle: (k: string) => void }) {
  const groups = useMemo(() => {
    const map: Record<string, { name: string; dept: string; total: number; entries: Entry[] }> = {}
    data.forEach(e => {
      const k = projectName(e)
      if (!map[k]) map[k] = { name: k, dept: deptName(e), total: 0, entries: [] }
      map[k].total += e.hours
      map[k].entries.push(e)
    })
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total)
  }, [data])

  return (
    <div className="space-y-3">
      {groups.map(g => (
        <div key={g.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => toggle(g.id)} className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-violet-100">
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

// ─── Weekly Summary ───────────────────────────────────────────────────────────

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
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {w.entries.length} entries · {new Set(w.entries.map(e => e.user_id)).size} people
                </div>
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

// ─── Detailed Log ─────────────────────────────────────────────────────────────

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

// ─── Shared entry table ───────────────────────────────────────────────────────

function EntryTable({ entries, showEmployee }: { entries: Entry[]; showEmployee: boolean }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full">
        <thead>
          <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] border-b border-slate-50">
            <th className="px-4 py-3 text-left">Date</th>
            {showEmployee
              ? <th className="px-4 py-3 text-left">Employee</th>
              : <th className="px-4 py-3 text-left">Project</th>
            }
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-right">Hours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map(e => (
            <tr key={e.id} className="text-sm hover:bg-slate-50/50">
              <td className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">{format(parseISO(e.date), 'MMM d, yyyy')}</td>
              {showEmployee
                ? <td className="px-4 py-3 font-bold text-slate-900">{userName(e)}</td>
                : <td className="px-4 py-3 font-bold text-indigo-600">{projectName(e)}</td>
              }
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

// ─── Excel builders ───────────────────────────────────────────────────────────

function buildDetailRows(data: Entry[]) {
  return [...data].sort((a, b) => b.date.localeCompare(a.date)).map(e => ({
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

function buildEmployeeRows(data: Entry[]) {
  const map: Record<string, Entry[]> = {}
  data.forEach(e => { const k = userName(e); if (!map[k]) map[k] = []; map[k].push(e) })
  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({ Employee: name, Date: e.date, Project: projectName(e), Department: deptName(e), Status: e.status, Hours: Number(e.hours).toFixed(2), Description: e.description || '', 'Additional Work': e.is_additional_work ? 'Yes' : 'No' })
    })
    rows.push({ Employee: `TOTAL: ${name}`, Date: '', Project: '', Department: '', Status: '', Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2), Description: '', 'Additional Work': '' })
    rows.push({})
  })
  return rows
}

function buildProjectRows(data: Entry[]) {
  const map: Record<string, Entry[]> = {}
  data.forEach(e => { const k = projectName(e); if (!map[k]) map[k] = []; map[k].push(e) })
  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([proj, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({ Project: proj, Department: deptName(e), Date: e.date, Employee: userName(e), Status: e.status, Hours: Number(e.hours).toFixed(2), Description: e.description || '', 'Additional Work': e.is_additional_work ? 'Yes' : 'No' })
    })
    rows.push({ Project: `TOTAL: ${proj}`, Department: '', Date: '', Employee: '', Status: '', Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2), Description: '', 'Additional Work': '' })
    rows.push({})
  })
  return rows
}

function buildWeeklyRows(data: Entry[]) {
  const map: Record<string, Entry[]> = {}
  data.forEach(e => { const wk = weekLabel(e.date); if (!map[wk]) map[wk] = []; map[wk].push(e) })
  const rows: any[] = []
  Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).forEach(([wk, entries]) => {
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      rows.push({ 'ISO Week': wk, Date: e.date, Employee: userName(e), Project: projectName(e), Department: deptName(e), Status: e.status, Hours: Number(e.hours).toFixed(2), Description: e.description || '' })
    })
    rows.push({ 'ISO Week': `TOTAL: ${wk}`, Date: '', Employee: '', Project: '', Department: '', Status: '', Hours: entries.reduce((s, e) => s + e.hours, 0).toFixed(2), Description: '' })
    rows.push({})
  })
  return rows
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