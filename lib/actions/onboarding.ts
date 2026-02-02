'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'
import { redirect } from 'next/navigation'

// --- EXISTING: Create New Company ---
export async function completeOnboarding(formData: FormData) {
    const companyName = formData.get('company_name') as string
    const tenantName = formData.get('tenant_name') as string || companyName
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const rawSlug = formData.get('tenant_slug') as string
    const slug = slugify(rawSlug || companyName)

    if (!companyName || !firstName || !lastName) {
        return { error: 'Company Name, First Name, and Last Name are required' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'User not authenticated' }

    const adminClient = createAdminClient()

    const payload = {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        organization_name: tenantName,
        slug: slug
    }

    const { data, error: rpcError } = await supabase.rpc('onboard_new_tenant', { payload })

    if (rpcError) {
        console.error('Onboarding RPC Full Error:', rpcError)
        return { error: rpcError.message || 'Failed to complete onboarding', details: rpcError }
    }

    // Update Profile with new Company ID
    await adminClient.from('profiles').update({
        tenant_id: data.tenant_id,
        current_company_id: data.company_id,
        status: 'active'
    }).eq('id', user.id)

    // Update Auth Metadata
    await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
            tenant_id: data.tenant_id,
            current_company_id: data.company_id,
            onboarded: true
        }
    })

    revalidatePath('/', 'layout')
    return { success: true }
}

// --- JOIN EXISTING (FIXED) ---
export async function joinExistingTenant(formData: FormData) {
    let workspaceId = formData.get('workspaceId') as string
    
    // AGGRESSIVE CLEANING
    if (workspaceId) {
        workspaceId = workspaceId.replace(/['""Â«Â»\s]/g, '').trim()
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!workspaceId || !uuidRegex.test(workspaceId)) {
        return { error: 'Invalid Workspace ID format.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not logged in' }

    const adminClient = createAdminClient()
    const { data: tenant, error: findError } = await adminClient
        .from('tenants')
        .select('id, name')
        .eq('id', workspaceId)
        .single()

    if (findError || !tenant) {
        return { error: 'Workspace not found. Check the ID.' }
    }

    // REMOVED 'onboarded: true' FROM BELOW:
    const { error: profileError } = await adminClient.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata.first_name || 'New',
        last_name: user.user_metadata.last_name || 'User',
        tenant_id: tenant.id,
        status: 'active'
    })

    if (profileError) return { error: 'Join failed: ' + profileError.message }

    // We still set 'onboarded: true' here (where it belongs):
    await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { onboarded: true, tenant_id: tenant.id }
    })

    revalidatePath('/', 'layout')
    return { success: true }
}
