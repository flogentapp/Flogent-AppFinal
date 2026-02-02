'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function joinExistingTenant(formData: FormData) {
    let workspaceId = formData.get('workspaceId') as string
    if (workspaceId) workspaceId = workspaceId.trim()

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!workspaceId || !uuidRegex.test(workspaceId)) {
        return { error: 'Invalid ID format. Must be a valid UUID.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not logged in' }

    // DEBUG: Try to find the tenant
    try {
        const adminClient = createAdminClient()
        const { data: tenant, error: findError } = await adminClient
            .from('tenants')
            .select('id, name')
            .eq('id', workspaceId)
            .single()

        if (findError) {
            console.error('Join Error:', findError)
            return { error: 'Database Error: ' + findError.message + ' (Code: ' + findError.code + ')' }
        }

        if (!tenant) return { error: 'Workspace not found (ID does not exist).' }

        const { error: profileError } = await adminClient.from('profiles').upsert({
            id: user.id, email: user.email, first_name: user.user_metadata.first_name || 'New',
            last_name: user.user_metadata.last_name || 'User', tenant_id: tenant.id, status: 'active', onboarded: true
        })

        if (profileError) return { error: 'Profile Link Failed: ' + profileError.message }

        await supabase.auth.updateUser({ data: { onboarded: true, tenant_id: tenant.id } })
        return { success: true }

    } catch (e: any) {
        console.error('System Join Error:', e)
        return { error: 'System Error: ' + e.message }
    }
}
