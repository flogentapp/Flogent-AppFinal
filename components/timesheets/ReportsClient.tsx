'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'
import { Download, Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ReportsClient({ initialData }: { initialData: any[] }) {
  // --- STATE ---
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState('All')
  const [selectedUser, setSelectedUser] = useState('All')
  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedWorkType, setSelectedWorkType] = useState('All')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  // --- EXTRACT UNIQUE OPTIONS ---
  const options = useMemo(() => {
    const projects = new Set(['All'])
    const users = new Set(['All'])
    const depts = new Set(['All'])

    initialData.forEach(item => {
      const projectName = item.projects?.name
      const userName = item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : null
      const deptName = item.projects?.departments?.name

      if (projectName) projects.add(projectName)
      if (userName) users.add(userName)
      if (deptName) depts.add(deptName)
    })

    return {
      projects: Array.from(projects).sort(),
      users: Array.from(users).sort(),
      depts: Array.from(depts).sort()
    }
  }, [initialData])

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      const date = parseISO(item.date)
      const start = parseISO(dateRange.start)
      const end = parseISO(dateRange.end)

      if (!isWithinInterval(date, { start, end })) return false

      const userName = `${item.profiles?.first_name} ${item.profiles?.last_name}`
      const projectName = item.projects?.name || ''
      const deptName = item.projects?.departments?.name || 'Unassigned'

      if (selectedProject !== 'All' && projectName !== selectedProject) return false
      if (selectedUser !== 'All' && userName !== selectedUser) return false
      if (selectedDept !== 'All' && deptName !== selectedDept) return false

      if (selectedWorkType === 'Additional' && !item.is_additional_work) return false
      if (selectedWorkType === 'Standard' && item.is_additional_work) return false

      if (search) {
        const lowerSearch = search.toLowerCase()
        return (
          item.description?.toLowerCase().includes(lowerSearch) ||
          projectName.toLowerCase().includes(lowerSearch) ||
          userName.toLowerCase().includes(lowerSearch)
        )
      }
      return true
    })
  }, [initialData, search, selectedProject, selectedUser, selectedDept, selectedWorkType, dateRange])

  // --- GROUPING BY USER ---
  const groupedByUser = useMemo(() => {
    const groups: Record<string, { profile: any, total: number, entries: any[] }> = {}

    filteredData.forEach(entry => {
      const uid = entry.user_id
      if (!groups[uid]) {
        groups[uid] = { profile: entry.profiles, total: 0, entries: [] }
      }
      groups[uid].total += entry.hours
      groups[uid].entries.push(entry)
    })

    return Object.entries(groups)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData])

  const totalHours = filteredData.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)

  const toggleUser = (userId: string) => {
    const next = new Set(expandedUsers)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setExpandedUsers(next)
  }

  return (
    <div className="space-y-6">
      {/* HEADER & METRICS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Reports</h1>
          <p className="text-gray-500 text-sm font-medium">Aggregated team performance analytics.</p>
        </div>
        <div className="flex items-center gap-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Grand Total</div>
            <div className="text-4xl font-black text-indigo-600 leading-none">
              {totalHours.toFixed(1)}<span className="text-xs ml-0.5 opacity-40">h</span>
            </div>
          </div>
          <div className="h-12 w-px bg-gray-200"></div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Active Headcount</div>
            <div className="text-4xl font-black text-gray-900 leading-none">{groupedByUser.length}</div>
          </div>
          <Button variant="outline" className="hidden sm:flex ml-4 rounded-xl border-gray-200 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">From Date</label>
            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">To Date</label>
            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">Department</label>
            <select className="w-full h-10 px-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white border-r-8 border-transparent" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              {options.depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">Project</label>
            <select className="w-full h-10 px-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white border-r-8 border-transparent" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              {options.projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
          <div className="lg:col-span-3">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">Search Description / Context</label>
            <div className="relative">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Filter by notes, project codes, or names..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest">Work Type</label>
            <select className="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white border-r-8 border-transparent" value={selectedWorkType} onChange={(e) => setSelectedWorkType(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Standard">Standard Work</option>
              <option value="Additional">Additional Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA VISUALIZATION - PERSON TOTALS */}
      <div className="space-y-4">
        {groupedByUser.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-[2rem] border border-dashed border-slate-200">
            <X className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No results matching your filters.</p>
          </div>
        ) : (
          groupedByUser.map(group => (
            <div key={group.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-indigo-100">
              {/* SUMMARY ROW (PERSON TOTAL) */}
              <button
                onClick={() => toggleUser(group.id)}
                className="w-full flex items-center justify-between p-6 sm:p-8 text-left hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                    {group.profile?.first_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{group.profile?.first_name} {group.profile?.last_name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{group.entries.length} segments loged</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Cumulative</div>
                    <div className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{group.total.toFixed(1)}h</div>
                  </div>
                  <div className={`p-2 rounded-full border border-slate-200 transition-all ${expandedUsers.has(group.id) ? 'rotate-180 bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-400 group-hover:text-slate-900'}`}>
                    <Filter className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* DETAILS SECTION (INDIVIDUAL ENTRIES) */}
              {expandedUsers.has(group.id) && (
                <div className="px-6 pb-8 border-t border-slate-50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="overflow-x-auto mt-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50">
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Project / Department</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.entries.map(entry => (
                          <tr key={entry.id} className="text-sm hover:bg-slate-50/50">
                            <td className="px-4 py-4 font-bold text-slate-500 whitespace-nowrap">
                              {format(parseISO(entry.date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-bold text-indigo-600 truncate max-w-[150px]">{entry.projects?.name}</div>
                              <div className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{entry.projects?.departments?.name || 'General'}</div>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={entry.status} />
                            </td>
                            <td className="px-4 py-4 text-slate-400 italic text-xs max-w-xs truncate">
                              "{entry.description || 'No notes'}"
                            </td>
                            <td className="px-4 py-4 text-right font-black text-slate-900">
                              {entry.hours}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    submitted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100',
    draft: 'bg-slate-50 text-slate-500 border-slate-100'
  }
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight border ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}