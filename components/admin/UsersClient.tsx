'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, UserPlus, Trash2, Loader2 } from 'lucide-react'
import { AssignUserModal } from '@/components/admin/AssignUserModal'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { useRouter } from 'next/navigation'
import { deleteUser } from '@/lib/actions/users'
import { toast } from 'sonner'

export function UsersClient({ users, projects, memberships }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const membershipsByUser = useMemo(() => {
    const map: any = {}
    for (const m of memberships || []) {
      if (!map[m.user_id]) map[m.user_id] = []
      map[m.user_id].push(m)
    }
    return map
  }, [memberships])

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure? This will delete all their timesheets and data.')) return

    setDeletingId(userId)
    try {
      const res = await deleteUser(userId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('User deleted')
        router.refresh()
      }
    } catch (e) {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Users and Project Assignments</h1>
          <p className='text-gray-500 text-sm'>Manage your team and their access to projects in the selected company.</p>
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={() => setIsInviteOpen(true)} variant='outline' className='bg-white'>
            <UserPlus className='w-4 h-4 mr-2' /> Create User
          </Button>
          <Button onClick={() => setIsModalOpen(true)} disabled={!projects?.length || !users?.length}>
            <Plus className='w-4 h-4 mr-2' /> Assign to Project
          </Button>
        </div>
      </div>

      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-100'>
          <thead className='bg-gray-50/50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>User</th>
              <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>Email</th>
              <th className='px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase'>Assignments</th>
              <th className='px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase'>Action</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {users.map((u: any) => {
              const ms = membershipsByUser[u.id] || []
              return (
                <tr key={u.id} className='hover:bg-gray-50/50'>
                  <td className='px-6 py-4'>
                    <div className='text-sm font-bold text-gray-900'>{u.first_name} {u.last_name}</div>
                    <div className='text-xs text-gray-400 capitalize'>{u.status || 'active'}</div>
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>{u.email}</td>
                  <td className='px-6 py-4'>
                    {ms.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {ms.map((m: any) => (
                          <span key={m.id} className='inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded'>
                            {m.projects?.name} ({m.role})
                          </span>
                        ))}
                      </div>
                    ) : <span className='text-xs text-gray-400'>No assignments</span>}
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      disabled={deletingId === u.id}
                      onClick={() => handleDelete(u.id)}
                    >
                      {deletingId === u.id ? <Loader2 className='w-4 h-4 animate-spin' /> : <Trash2 className='w-4 h-4' />}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AssignUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} users={users} projects={projects} onAssigned={() => { setIsModalOpen(false); router.refresh() }} />
      <AssignUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} users={users} projects={projects} onAssigned={() => { setIsModalOpen(false); router.refresh() }} />
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => { setIsInviteOpen(false); router.refresh() }}
        currentCompanyId={projects?.[0]?.company_id}
      />
    </div>
  )
}
