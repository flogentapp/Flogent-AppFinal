'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Check who is making the request
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 2. Verify they are the TenantOwner (The only one who can change structure)
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUser?.role !== 'TenantOwner') {
    return { error: 'Unauthorized: Only the Tenant Owner can assign roles.' }
  }

  // 3. Update the target user
  const targetUserId = formData.get('userId') as string
  const newRole = formData.get('role') as string

  // Security: Validate the role is real to prevent broken schema
  const VALID_ROLES = ['User', 'ProjectLeader', 'DepartmentHead', 'CEO', 'TenantOwner']
  if (!VALID_ROLES.includes(newRole)) {
    return { error: 'Invalid role selected' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/team') // Refresh the list
  return { success: true }
}