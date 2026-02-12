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
  const [selectedWorkType, setSelectedWorkType] = useState('All') // All, Standard, Additional
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  // --- EXTRACT UNIQUE OPTIONS FOR DROPDOWNS ---
  const options = useMemo(() => {
    const projects = new Set(['All'])
    const users = new Set(['All'])
    const depts = new Set(['All'])

    initialData.forEach(item => {
      if (item.projects?.name) projects.add(item.projects.name)
      if (item.profiles) users.add(`${item.profiles.first_name} ${item.profiles.last_name}`)
      if (item.projects?.departments?.name) depts.add(item.projects.departments.name)
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

      // 1. Date Range Check
      const inDate = isWithinInterval(date, { start, end })
      if (!inDate) return false

      // 2. Dropdown Checks
      const userName = `${item.profiles?.first_name} ${item.profiles?.last_name}`
      const projectName = item.projects?.name || ''
      const deptName = item.projects?.departments?.name || 'Unassigned'

      if (selectedProject !== 'All' && projectName !== selectedProject) return false
      if (selectedUser !== 'All' && userName !== selectedUser) return false
      if (selectedDept !== 'All' && deptName !== selectedDept) return false

      if (selectedWorkType === 'Additional' && !item.is_additional_work) return false
      if (selectedWorkType === 'Standard' && item.is_additional_work) return false

      // 3. Text Search (Description, etc)
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          item.description?.toLowerCase().includes(searchLower) ||
          projectName.toLowerCase().includes(searchLower) ||
          userName.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [initialData, search, selectedProject, selectedUser, selectedDept, selectedWorkType, dateRange])

  // --- CALCULATE TOTALS ---
  const totalHours = filteredData.reduce((sum, item) => sum + (item.hours || 0), 0)

  return (
    <div className="space-y-6">
      {/* HEADER & METRICS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Timesheet Reports</h1>
          <p className="text-gray-500 text-sm font-medium">Analyze team performance and project visibility.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Hours</div>
            <div className="text-3xl font-black text-indigo-600 leading-none">{totalHours.toFixed(1)}</div>
          </div>
          <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Logs</div>
            <div className="text-3xl font-black text-gray-900 leading-none">{filteredData.length}</div>
          </div>
          <Button variant="outline" className="ml-4 border-gray-200 hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Start */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">From Date</label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">To Date</label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
            />
          </div>

          {/* Dept Filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">Department</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {options.depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">Project Name</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {options.projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
          {/* User Filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">Employee</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {options.users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Work Type Filter */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">Work Type</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(e.target.value)}
            >
              <option value="All">All Work</option>
              <option value="Standard">Standard Only</option>
              <option value="Additional">Additional Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1.5 tracking-wider">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, project, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DATA VISUALIZATION */}
      <div className="space-y-4">
        {/* MOBILE CARDS */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {filteredData.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-dashed border-gray-200">
              No entries found matching these filters.
            </div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                      {format(parseISO(item.date), 'MMM d, yyyy')}
                    </div>
                    <div className="font-black text-slate-900 text-sm">
                      {item.profiles?.first_name} {item.profiles?.last_name}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="flex items-center justify-between py-3 border-y border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Project</span>
                    <span className="text-sm font-bold text-indigo-600">{item.projects?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-0.5">Hours</span>
                    <span className="text-lg font-black text-slate-900 leading-none">{item.hours}h</span>
                  </div>
                </div>

                {item.description && (
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{item.description}"</p>
                  </div>
                )}

                <div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-black tracking-tight border border-slate-200">
                    {item.projects?.departments?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Project</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-3 text-right">Hours</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                    No entries found matching these filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-gray-500 whitespace-nowrap font-medium">
                      {format(parseISO(item.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-gray-900 font-bold whitespace-nowrap">
                      {item.profiles?.first_name} {item.profiles?.last_name}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-black tracking-tight border border-slate-200">
                        {item.projects?.departments?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-indigo-600 font-bold">
                      {item.projects?.name}
                    </td>
                    <td className="px-6 py-5 text-gray-500 max-w-xs truncate font-medium" title={item.description}>
                      {item.description}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900">
                      {item.hours}h
                    </td>
                    <td className="px-6 py-5 text-right">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}