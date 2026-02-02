'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Get Tenant ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const password = formData.get('password') as string

    if (!email || !firstName || !lastName || !password) {
        return { error: 'Missing required fields' }
    }

    const adminClient = createAdminClient()

    // 2. Create User Directly (Auto-confirmed)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            tenant_id: profile.tenant_id,
            first_name: firstName,
            last_name: lastName,
            onboarded: true
        }
    })

    if (createError) {
        return { error: 'Database Error: ' + createError.message }
    }

    const newUser = userData.user

    // 3. Create Profile
    await adminClient.from('profiles').insert({
        id: newUser.id,
        tenant_id: profile.tenant_id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        status: 'active',
        current_company_id: profile.current_company_id
    })

    // 4. Assign Default Role for the Company (Isolation Fix)
    if (profile.current_company_id) {
        await adminClient.from('user_role_assignments').insert({
            user_id: newUser.id,
            tenant_id: profile.tenant_id,
            role: 'Member',
            scope_type: 'company',
            scope_id: profile.current_company_id,
            created_by: user.id
        })
    }

    const inviterName = `${user.user_metadata.first_name || 'Admin'} ${user.user_metadata.last_name || ''}`.trim()

    // 4. Send Credentials Email (FIXED)
    try {
        const { sendCredentialsEmail } = await import('@/lib/mailjet')

        // CRITICAL FIX: We are now passing profile.tenant_id as the 5th argument!
        const emailResult = await sendCredentialsEmail(email, password, inviterName, firstName, profile.tenant_id)

        if (!emailResult.success) {
            console.error('Mailjet Error:', emailResult.error)
            // CRITICAL FIX: Return the REAL error message so you can see it on screen
            return { error: 'User created, BUT email failed: ' + emailResult.error }
        }
    } catch (importErr: any) {
        return { error: 'System Error: ' + importErr.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

// --- DELETE USER FUNCTION ---
export async function deleteUser(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (user.id === userId) return { error: 'You cannot delete your own account.' }

    const adminClient = createAdminClient()

    await adminClient.from('project_memberships').delete().eq('user_id', userId)
    await adminClient.from('department_memberships').delete().eq('user_id', userId)
    await adminClient.from('timesheets').delete().eq('user_id', userId)
    await adminClient.from('approvals').delete().eq('approver_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}