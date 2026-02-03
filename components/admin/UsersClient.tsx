'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, UserPlus, Trash2, Loader2, Link } from 'lucide-react'
import { AssignUserModal } from '@/components/admin/AssignUserModal'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { AssignExistingUserModal } from '@/components/admin/AssignExistingUserModal'
import { useRouter } from 'next/navigation'
import { removeUserFromCompany } from '@/lib/actions/admin'
import { toast } from 'sonner'

export function UsersClient({ users, projects, memberships, currentCompanyId, companies, allTenantUsers }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isExistingOpen, setIsExistingOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  const router = useRouter()

  const membershipsByUser = useMemo(() => {
    const map: any = {}
    for (const m of memberships || []) {
      if (!map[m.user_id]) map[m.user_id] = []
      map[m.user_id].push(m)
    }
    return map
  }, [memberships])

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this user from the current company? They will lose access to all projects in this company.')) return

    if (!mounted) return
    setDeletingId(userId)
    try {
      const res = await removeUserFromCompany(userId, currentCompanyId)
      if (!mounted) return
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('User removed from company')
        router.refresh()
      }
    } catch (e) {
      toast.error('Failed to remove user')
    } finally {
      if (mounted) setDeletingId(null)
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
          <Button onClick={() => setIsExistingOpen(true)} variant='outline' className='bg-white'>
            <Link className='w-4 h-4 mr-2' /> Add Existing
          </Button>
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
                      onClick={() => handleRemove(u.id)}
                      title="Remove from Company"
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
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => { setIsInviteOpen(false); router.refresh() }}
        currentCompanyId={currentCompanyId}
      />
      <AssignExistingUserModal
        isOpen={isExistingOpen}
        onClose={() => setIsExistingOpen(false)}
        allUsers={allTenantUsers}
        currentUsers={users}
        currentCompanyId={currentCompanyId}
        onAssigned={() => { setIsExistingOpen(false); router.refresh() }}
      />
    </div>
  )
}
