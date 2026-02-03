'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendCredentialsEmail } from '@/lib/mailjet'

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

    // 2. Determine Company for New User EARLY (to include in metadata)
    let targetCompanyId = formData.get('companyId') as string
    if (!targetCompanyId) {
        const { data: companies } = await adminClient
            .from('companies')
            .select('id')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'active')
            .order('name')
            .limit(1)
        targetCompanyId = companies?.[0]?.id || profile.current_company_id
    }

    // 3. Create User Directly (Auto-confirmed)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            tenant_id: profile.tenant_id,
            current_company_id: targetCompanyId, // SET HERE
            first_name: firstName,
            last_name: lastName,
            onboarded: true
        }
    })

    if (createError) {
        return { error: 'Database Error: ' + createError.message }
    }

    const newUser = userData.user

    // 4. Create Profile (Use upsert to handle potential trigger-generated profiles)
    const { error: profileError } = await adminClient.from('profiles').upsert({
        id: newUser.id,
        tenant_id: profile.tenant_id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        status: 'active',
        current_company_id: targetCompanyId
    })

    if (profileError) {
        return { error: 'Profile Error: ' + profileError.message }
    }

    // 5. Update Profile current_company_id
    // This ensures they see the company in their switcher and appear in the admin list
    if (targetCompanyId) {
        await adminClient.from('profiles').update({ current_company_id: targetCompanyId }).eq('id', newUser.id)
    }

    // 6. Role assignments are handled via RBAC for managers only. 
    // Regular users (who just log time) do not need explicit rows in user_role_assignments
    // for visibility, as the AppNavbar now falls back to tenant-wide visibility if no roles exist.

    const inviterName = `${user.user_metadata.first_name || 'Admin'} ${user.user_metadata.last_name || ''}`.trim()

    // Send Credentials Email
    const emailResult = await sendCredentialsEmail(email, password, inviterName, firstName, profile.tenant_id)

    if (!emailResult.success) {
        console.error('Mailjet Error:', emailResult.error)
        // CRITICAL FIX: Return the REAL error message so you can see it on screen
        return { error: 'User created, BUT email failed: ' + emailResult.error }
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