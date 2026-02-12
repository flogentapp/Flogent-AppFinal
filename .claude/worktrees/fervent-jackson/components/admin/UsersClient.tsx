'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import { AssignUserModal } from '@/components/admin/AssignUserModal'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: string
  email: string
  first_name: string
  last_name: string
  status?: string
}

type ProjectRow = {
  id: string
  name: string
  code?: string
}

export function UsersClient({
  users,
  projects,
  memberships
}: {
  users: UserRow[]
  projects: ProjectRow[]
  memberships: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const membershipsByUser = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const m of memberships || []) {
      if (!map[m.user_id]) map[m.user_id] = []
      map[m.user_id].push(m)
    }
    return map
  }, [memberships])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users and Project Assignments</h1>
          <p className="text-gray-500 text-sm">Assign users to projects with roles.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} disabled={projects.length === 0 || users.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Assign user to project
        </Button>
      </div>

      {projects.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
          No projects found for the current company. Create a project first.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Assignments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const ms = membershipsByUser[u.id] || []
              return (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{u.first_name} {u.last_name}</div>
                    <div className="text-xs text-gray-400">{u.status || 'active'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    {ms.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ms.map(m => (
                          <span
                            key={m.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded"
                          >
                            {m.projects?.name} ({m.role})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No assignments</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AssignUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        projects={projects}
        onAssigned={() => {
          setIsModalOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
