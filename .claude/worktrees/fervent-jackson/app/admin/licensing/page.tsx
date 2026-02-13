import LicensingConfig from '@/components/admin/LicensingConfig'
import { createClient } from '@/lib/supabase/server'

export default async function LicensingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8">Please sign in to view this page.</div>
  }

  const tenantId = user.user_metadata?.tenant_id
  if (!tenantId) {
    return <div className="p-8">No tenant context found.</div>
  }

  // Fetch the current settings using tenant_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('license_settings')
    .eq('id', tenantId)
    .single()

  // Default to empty object if no settings found
  const currentSettings = tenant?.license_settings || {}

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workspace Configuration</h1>
        <p className="text-gray-500 mt-2">Manage permissions and billing settings for your team.</p>
      </div>

      <LicensingConfig currentSettings={currentSettings} />
    </div>
  )
}
