'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function switchContext(type: 'company' | 'department' | 'project', id: string | null) {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const updateData: any = {}
    const metadataUpdate: any = {}

    if (type === 'company') {
        updateData.current_company_id = id
        updateData.department_id = null
        metadataUpdate.current_company_id = id
        metadataUpdate.current_department_id = null
        metadataUpdate.current_project_id = null
    } else if (type === 'department') {
        updateData.department_id = id
        metadataUpdate.current_department_id = id
        metadataUpdate.current_project_id = null
    } else if (type === 'project') {
        metadataUpdate.current_project_id = id
    }

    // Attempt to update profile
    const { error: profileError } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

    // Even if profile update fails (due to missing columns), we update metadata as fallback
    await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...user.user_metadata,
            ...metadataUpdate
        }
    })

    revalidatePath('/', 'layout')
}
