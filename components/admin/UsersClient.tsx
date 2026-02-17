'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, UserPlus, Trash2, Loader2, Link, Shield } from 'lucide-react'
import { AssignUserModal } from '@/components/admin/AssignUserModal'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { AssignExistingUserModal } from '@/components/admin/AssignExistingUserModal'
import { UserRoleModal } from '@/components/admin/UserRoleModal'
import { useRouter } from 'next/navigation'
import { removeUserFromCompany } from '@/lib/actions/admin'
import { toast } from 'sonner'

export function UsersClient({ users, projects, memberships, orgRoles, currentCompanyId, companies, allTenantUsers }: any) {
  const [activeModal, setActiveModal] = useState<'assign' | 'invite' | 'existing' | 'role' | null>(null)
  const [roleModalUser, setRoleModalUser] = useState<any>(null)
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

  const orgRolesByUser = useMemo(() => {
    const map: any = {}
    for (const r of orgRoles || []) {
      if (!map[r.user_id]) map[r.user_id] = []
      map[r.user_id].push(r)
    }
    return map
  }, [orgRoles])

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
          <Button onClick={() => setActiveModal('existing')} variant='outline' className='bg-white'>
            <Link className='w-4 h-4 mr-2' /> Add Existing
          </Button>
          <Button onClick={() => setActiveModal('invite')} variant='outline' className='bg-white'>
            <UserPlus className='w-4 h-4 mr-2' /> Create User
          </Button>
          <Button onClick={() => setActiveModal('assign')} disabled={!projects?.length || !users?.length}>
            <Plus className='w-4 h-4 mr-2' /> Assign to Project
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* MOBILE CARDS */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {users.map((u: any) => {
            const ms = membershipsByUser[u.id] || []
            const roles = orgRolesByUser[u.id] || []
            const isDeleting = deletingId === u.id

            return (
              <div key={u.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg uppercase">
                      {u.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 leading-tight">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{u.status || 'active'}</div>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-red-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1'
                    disabled={isDeleting}
                    onClick={() => handleRemove(u.id)}
                  >
                    {isDeleting ? <Loader2 className='w-5 h-5 animate-spin' /> : <Trash2 className='w-5 h-5' />}
                  </Button>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mb-1">Contact Email</div>
                    <div className="text-sm font-bold text-slate-700">{u.email}</div>
                  </div>

                  {roles.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mb-1">Company Roles</div>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((r: any) => (
                          <span key={r.id} className="inline-flex items-center px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest">
                            <Shield className="w-2.5 h-2.5 mr-1" /> {r.role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] px-1">Project Access</div>
                  {ms.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {ms.map((m: any) => (
                        <span key={m.id} className='px-3 py-1.5 text-xs font-black bg-white text-indigo-600 rounded-xl border border-indigo-50 shadow-sm'>
                          {m.projects?.name} <span className="text-slate-400 mx-1">·</span> <span className="opacity-70">{m.role}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className='text-xs text-slate-400 font-bold italic px-1'>No active assignments</div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                  onClick={() => { setRoleModalUser(u); setActiveModal('role'); }}
                >
                  <Shield className="w-3.5 h-3.5 mr-2" /> Modify Auth Roles
                </Button>
              </div>
            )
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className='hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden'>
          <table className='min-w-full divide-y divide-slate-100'>
            <thead className='bg-slate-50/50'>
              <tr>
                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Employee</th>
                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Email Address</th>
                <th className='px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Project Roles</th>
                <th className='px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {users.map((u: any) => {
                const ms = membershipsByUser[u.id] || []
                const roles = orgRolesByUser[u.id] || []
                return (
                  <tr key={u.id} className='hover:bg-slate-50/50 transition-colors group'>
                    <td className='px-8 py-5'>
                      <div className='flex items-center gap-3'>
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs uppercase group-hover:bg-white group-hover:shadow-sm transition-all">
                          {u.first_name?.charAt(0)}
                        </div>
                        <div>
                          <div className='text-sm font-black text-slate-900'>{u.first_name} {u.last_name}</div>
                          <div className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>{u.status || 'active'}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-8 py-5'>
                      <div className='text-sm font-black text-slate-900'>{u.email}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {roles.map((r: any) => (
                          <span key={r.id} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest">
                            {r.role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className='px-8 py-5'>
                      {ms.length > 0 ? (
                        <div className='flex flex-wrap gap-2'>
                          {ms.map((m: any) => (
                            <span key={m.id} className='inline-flex items-center px-2.5 py-1 text-[10px] font-black bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100'>
                              {m.projects?.name} <span className="mx-1.5 opacity-30">|</span> {m.role}
                            </span>
                          ))}
                        </div>
                      ) : <span className='text-xs text-slate-400 font-bold italic'>No assignments</span>}
                    </td>
                    <td className='px-8 py-5 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all'
                        onClick={() => { setRoleModalUser(u); setActiveModal('role'); }}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all'
                        disabled={deletingId === u.id}
                        onClick={() => handleRemove(u.id)}
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
      </div>

      <AssignUserModal
        isOpen={activeModal === 'assign'}
        onClose={() => setActiveModal(null)}
        users={users}
        projects={projects}
        onAssigned={() => { setActiveModal(null); router.refresh() }}
      />
      <InviteUserModal
        isOpen={activeModal === 'invite'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => { setActiveModal(null); router.refresh() }}
        currentCompanyId={currentCompanyId}
      />
      <AssignExistingUserModal
        isOpen={activeModal === 'existing'}
        onClose={() => setActiveModal(null)}
        allUsers={allTenantUsers}
        currentUsers={users}
        currentCompanyId={currentCompanyId}
        onAssigned={() => { setActiveModal(null); router.refresh() }}
      />
      <UserRoleModal
        isOpen={activeModal === 'role'}
        onClose={() => { setActiveModal(null); setRoleModalUser(null); }}
        user={roleModalUser}
        roles={roleModalUser ? orgRolesByUser[roleModalUser.id] : []}
        currentCompanyId={currentCompanyId}
        onUpdated={() => { router.refresh() }}
      />
    </div>
  )
}
