'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_ROLES = ['TenantOwner', 'CEO', 'Admin']

export async function updateLicensingSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const tenantId = user.user_metadata?.tenant_id
  if (!tenantId) return { error: 'No tenant context' }

  // Verify admin role
  const { data: roles } = await supabase
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .in('scope_type', ['system', 'tenant'])

  const hasAdminRole = roles?.some(r => ADMIN_ROLES.includes(r.role))
  if (!hasAdminRole) return { error: 'Unauthorized: Admin access required' }

  // Parse the form data into a JSON object
  const settings: Record<string, boolean> = {}

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('role_')) {
      const roleName = key.replace('role_', '')
      settings[roleName] = value === 'on'
    }
  }

  // Always force Owner to be true (safety check)
  settings['Owner'] = true

  // Save to the Tenants table using tenant_id
  const { error } = await supabase
    .from('tenants')
    .update({ license_settings: settings })
    .eq('id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}
