'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { assignUserToProject } from '@/lib/actions/admin'

type Role = 'User' | 'ProjectLeader'

export function AssignUserModal({
  isOpen,
  onClose,
  users,
  projects,
  onAssigned
}: {
  isOpen: boolean
  onClose: () => void
  users: any[]
  projects: any[]
  onAssigned: () => void
}) {
  const [userId, setUserId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [role, setRole] = useState<Role>('User')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await assignUserToProject(userId, projectId, role)
    setLoading(false)

    if (res?.error) {
      alert(res.error)
      return
    }

    onAssigned()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign user to project">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a user</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a project</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="User">User (can log time)</option>
            <option value="ProjectLeader">Project Leader (can manage and approve)</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
