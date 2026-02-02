import { createClient } from '@/lib/supabase/server'

export type UserPermissions = {
    isOwner: boolean
    isCEO: boolean
    isDepartmentHead: boolean
    isProjectLeader: boolean
    canManageAny: boolean
    managedDepartmentIds: string[]
    managedProjectIds: string[]
}

export async function getUserPermissions(): Promise<UserPermissions> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {
        isOwner: false,
        isCEO: false,
        isDepartmentHead: false,
        isProjectLeader: false,
        canManageAny: false,
        managedDepartmentIds: [],
        managedProjectIds: []
    }

    // Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, current_company_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return {
        isOwner: false,
        isCEO: false,
        isDepartmentHead: false,
        isProjectLeader: false,
        canManageAny: false,
        managedDepartmentIds: [],
        managedProjectIds: []
    }

    // 1. Check Owner
    const { data: tenant } = await supabase
        .from('tenants')
        .select('owner_user_id')
        .eq('id', profile.tenant_id)
        .single()

    const isOwner = tenant?.owner_user_id === user.id
    if (isOwner) {
        return {
            isOwner: true,
            isCEO: true,
            isDepartmentHead: true,
            isProjectLeader: true,
            canManageAny: true,
            managedDepartmentIds: [], // Empty means "all" in context of isOwner
            managedProjectIds: []
        }
    }

    // 2. Fetch roles and memberships
    const [
        { data: roles },
        { data: memberships }
    ] = await Promise.all([
        supabase
            .from('user_role_assignments')
            .select('role, scope_type, scope_id')
            .eq('user_id', user.id),
        supabase
            .from('project_memberships')
            .select('project_id, role')
            .eq('user_id', user.id)
            .eq('role', 'ProjectLeader')
    ])

    const isCEO = roles?.some(r => r.role === 'CEO') || false
    const managedDepartmentIds = roles?.filter(r => r.role === 'DepartmentHead').map(r => r.scope_id) || []
    const isDepartmentHead = managedDepartmentIds.length > 0
    const managedProjectIds = memberships?.map(m => m.project_id) || []
    const isProjectLeader = managedProjectIds.length > 0

    return {
        isOwner: false,
        isCEO,
        isDepartmentHead,
        isProjectLeader,
        canManageAny: isCEO || isDepartmentHead || isProjectLeader,
        managedDepartmentIds,
        managedProjectIds
    }
}
