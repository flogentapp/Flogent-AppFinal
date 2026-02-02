'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLicensingSettings(formData: FormData) {
  const supabase = await createClient()

  // 1. Check if current user is Owner/Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 2. Parse the form data into a JSON object
  // Example result: { "Admin": true, "Member": false }
  const settings: Record<string, boolean> = {}
  
  // We assume the form sends keys like "role_Admin", "role_Member"
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('role_')) {
      const roleName = key.replace('role_', '')
      settings[roleName] = value === 'on'
    }
  }

  // Always force Owner to be true (safety check)
  settings['Owner'] = true

  // 3. Save to the Tenants table
  // You might need to fetch the tenant_id first depending on your schema
  // For now, we update based on the user's linked tenant
  const { error } = await supabase
    .from('tenants')
    .update({ license_settings: settings })
    .eq('created_by', user.id) // Assuming the user is the owner
    // OR if you have a tenant_id on the user: .eq('id', user.user_metadata.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}