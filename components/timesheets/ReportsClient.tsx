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
  const [selectedCompany, setSelectedCompany] = useState('All') // Client/Tenant
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  // --- EXTRACT UNIQUE OPTIONS FOR DROPDOWNS ---
  const options = useMemo(() => {
    const projects = new Set(['All'])
    const users = new Set(['All'])
    const companies = new Set(['All'])

    initialData.forEach(item => {
      if (item.projects?.name) projects.add(item.projects.name)
      if (item.profiles) users.add(`${item.profiles.first_name} ${item.profiles.last_name}`)
      // Assuming 'Company' refers to the Project's Client or the User's Department/Company
      // For now, let's try to pull 'Client' from project or fallback to 'Internal'
      const company = item.projects?.client_name || 'Internal'
      companies.add(company)
    })

    return {
      projects: Array.from(projects),
      users: Array.from(users),
      companies: Array.from(companies)
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
      const companyName = item.projects?.client_name || 'Internal'

      if (selectedProject !== 'All' && projectName !== selectedProject) return false
      if (selectedUser !== 'All' && userName !== selectedUser) return false
      if (selectedCompany !== 'All' && companyName !== selectedCompany) return false

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
  }, [initialData, search, selectedProject, selectedUser, selectedCompany, dateRange])

  // --- CALCULATE TOTALS ---
  const totalHours = filteredData.reduce((sum, item) => sum + (item.hours || 0), 0)

  return (
    <div className="space-y-6">
      {/* HEADER & METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">View and analyze time logs.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-sm text-gray-500 font-medium uppercase">Total Hours</div>
                <div className="text-3xl font-bold text-indigo-600">{totalHours.toFixed(1)}</div>
            </div>
            <div className="h-10 w-px bg-gray-200 mx-2"></div>
            <div className="text-right">
                <div className="text-sm text-gray-500 font-medium uppercase">Entries</div>
                <div className="text-3xl font-bold text-gray-900">{filteredData.length}</div>
            </div>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Date Start */}
        <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">From</label>
            <Input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-white"
            />
        </div>

        {/* Date End */}
        <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">To</label>
            <Input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-white"
            />
        </div>

        {/* Project Filter */}
        <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Project</label>
            <select 
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
            >
                {options.projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>

        {/* User Filter */}
        <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">User</label>
            <select 
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
            >
                {options.users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
        </div>

         {/* Search Box */}
         <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Search</label>
            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Description..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Project</th>
              <th className="px-6 py-3 text-left">Client/Company</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-right">Hours</th>
              <th className="px-6 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredData.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No entries found matching these filters.
                    </td>
                </tr>
            ) : (
                filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {format(parseISO(item.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {item.profiles?.first_name} {item.profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 text-indigo-600 font-medium">
                        {item.projects?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {item.projects?.client_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={item.description}>
                        {item.description}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                        {item.hours}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <StatusBadge status={item.status} />
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
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