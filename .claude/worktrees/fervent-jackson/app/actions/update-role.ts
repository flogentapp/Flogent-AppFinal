'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()

  // 1. Check who is making the request
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 2. Verify they are the TenantOwner
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (currentUser?.role !== 'TenantOwner') {
    return { error: 'Unauthorized: Only the Tenant Owner can assign roles.' }
  }

  // 3. Get and validate the target user
  const targetUserId = formData.get('userId') as string
  const newRole = formData.get('role') as string

  if (!targetUserId || !newRole) {
    return { error: 'User ID and role are required' }
  }

  // Security: Validate the role is real
  const VALID_ROLES = ['User', 'ProjectLeader', 'DepartmentHead', 'CEO', 'TenantOwner']
  if (!VALID_ROLES.includes(newRole)) {
    return { error: 'Invalid role selected' }
  }

  // Security: Verify target user is in the same tenant
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile || targetProfile.tenant_id !== currentUser.tenant_id) {
    return { error: 'User not found or access denied' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/team')
  return { success: true }
}
