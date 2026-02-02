'use client'

import { useState } from 'react'
import { Trash2, Plus, User, Shield } from 'lucide-react'
import { addMemberToProject, removeMemberFromProject } from '@/lib/actions/members'
import { Button } from '@/components/ui/Button'

export function TeamManager({ projectId, members, availableUsers }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter out users who are already members
  const memberIds = new Set(members.map((m: any) => m.profiles?.id))
  const candidates = availableUsers.filter((u: any) => !memberIds.has(u.id))

  async function handleAdd() {
    if (!selectedUser) return
    setLoading(true)
    await addMemberToProject(projectId, selectedUser)
    setLoading(false)
    setIsAdding(false)
    setSelectedUser('')
  }

  async function handleRemove(memberId: string) {
      if(!confirm('Remove this user from the project?')) return
      await removeMemberFromProject(memberId, projectId)
  }

  return (
    <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'>
      <div className='p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50'>
        <div>
            <h3 className='font-bold text-gray-900'>Project Team</h3>
            <p className='text-sm text-gray-500'>Manage who can track time on this project.</p>
        </div>
        {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size='sm' className='gap-2'>
                <Plus className='w-4 h-4' /> Add Member
            </Button>
        )}
      </div>

      {isAdding && (
          <div className='p-4 bg-indigo-50 border-b border-indigo-100 animate-in slide-in-from-top-2'>
              <label className='block text-xs font-bold text-indigo-900 uppercase mb-2'>Select User to Add</label>
              <div className='flex gap-2'>
                  <select 
                    className='flex-1 rounded-lg border-indigo-200 text-sm p-2 bg-white'
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                      <option value=''>Choose a user...</option>
                      {candidates.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                      ))}
                  </select>
                  <Button onClick={handleAdd} disabled={!selectedUser || loading}>
                    {loading ? 'Adding...' : 'Add'}
                  </Button>
                  <Button variant='ghost' onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
          </div>
      )}

      <div className='divide-y divide-gray-100'>
        {members.length === 0 ? (
            <div className='p-8 text-center text-gray-400 italic'>No members assigned yet.</div>
        ) : (
            members.map((m: any) => (
                <div key={m.id} className='p-4 flex items-center justify-between hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold'>
                            {m.profiles?.first_name?.[0] || <User className='w-5 h-5' />}
                        </div>
                        <div>
                            <div className='font-bold text-gray-900'>{m.profiles?.first_name} {m.profiles?.last_name}</div>
                            <div className='text-xs text-gray-500'>{m.profiles?.email}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleRemove(m.id)}
                        className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all'
                        title='Remove User'
                    >
                        <Trash2 className='w-4 h-4' />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
