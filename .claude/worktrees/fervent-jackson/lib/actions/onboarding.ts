'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'

export async function completeOnboarding(formData: FormData) {
    const companyName = formData.get('company_name') as string
    const tenantName = formData.get('tenant_name') as string || companyName
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const rawSlug = formData.get('tenant_slug') as string
    const slug = slugify(rawSlug || companyName)

    // Validate inputs
    if (!companyName || !firstName || !lastName) {
        return { error: 'Company Name, First Name, and Last Name are required' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'User not authenticated' }
    }

    // Initialize Admin Client
    const adminClient = createAdminClient()

    // 1. Call Onboarding RPC via Authenticated Client (so auth.uid() works)
    // Map payload keys to match backend signature: first_name, last_name, company_name, organization_name, slug
    const payload = {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        organization_name: tenantName,
        slug: slug
    }

    const { data, error: rpcError } = await supabase.rpc('onboard_new_tenant', {
        payload
    })

    if (rpcError) {
        console.error('Onboarding RPC Full Error:', rpcError)
        return {
            error: rpcError.message || 'Failed to complete onboarding',
            details: rpcError
        }
    }

    // 2. Update Profile and Auth Metadata via Admin Client
    // We do this as a final step to ensure the profile state is synced.
    // If current_company_id is missing from the table, we handle it gracefully.
    const profileUpdate: any = {
        tenant_id: data.tenant_id,
        status: 'active'
    }

    // Only add current_company_id if it's likely to exist (we'll try it first)
    // and if it fails, we fall back to a safer update.
    const { error: profileError } = await adminClient
        .from('profiles')
        .update({
            ...profileUpdate,
            current_company_id: data.company_id
        })
        .eq('id', user.id)

    if (profileError) {
        console.warn('Full profile update failed, attempting basic update:', profileError.message)
        // Fallback: Try update without current_company_id
        const { error: basicProfileError } = await adminClient
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id)

        if (basicProfileError) {
            console.error('Basic profile update also failed:', basicProfileError)
            return { error: 'Organization created but failed to update profile. Please try refreshing or contact support.' }
        }
    }

    // Update auth metadata to reflect the new tenant and company context
    const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
            tenant_id: data.tenant_id,
            current_company_id: data.company_id,
            onboarded: true
        }
    })

    if (authError) {
        console.error('Auth metadata update error:', authError)
    }

    // 3. Clear auth metadata/context refresh
    revalidatePath('/', 'layout')

    return { success: true }
}
