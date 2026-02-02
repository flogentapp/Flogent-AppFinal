import LicensingConfig from '@/components/admin/LicensingConfig'
import { createClient } from '@/utils/supabase/server'

export default async function LicensingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8">Please sign in to view this page.</div>
  }

  // 1. Fetch the current settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('license_settings')
    .eq('created_by', user.id)
    .single()

  // 2. Default to empty object if no settings found
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