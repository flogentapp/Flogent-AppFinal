import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserPermissions } from '@/types/permissions'

export async function getUserPermissions(): Promise<UserPermissions> {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {
        isOwner: false,
        isCEO: false,
        isDepartmentHead: false,
        isProjectLeader: false,
        canManageAny: false,
        managedCompanyIds: [],
        managedDepartmentIds: [],
        managedProjectIds: [],
        accessibleCompanyIds: [],
        accessibleDepartmentIds: [],
        allMemberProjIds: []
    }

    // Get Profile via admin
    const { data: profile } = await admin
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
        managedCompanyIds: [],
        managedDepartmentIds: [],
        managedProjectIds: [],
        accessibleCompanyIds: [],
        accessibleDepartmentIds: [],
        allMemberProjIds: []
    }

    // 1. Check Owner
    const { data: tenant } = await admin
        .from('tenants')
        .select('owner_user_id')
        .eq('id', profile.tenant_id)
        .single()

    const isOwner = tenant?.owner_user_id === user.id

    // 2. Fetch all metadata via admin
    const [
        { data: companies },
        { data: departments },
        { data: projects },
        { data: roles },
        { data: memberships }
    ] = await Promise.all([
        admin.from('companies').select('id').eq('tenant_id', profile.tenant_id),
        admin.from('departments').select('id').eq('tenant_id', profile.tenant_id),
        admin.from('projects').select('id').eq('tenant_id', profile.tenant_id),
        admin.from('user_role_assignments').select('role, scope_type, scope_id').eq('user_id', user.id),
        admin.from('project_memberships').select('project_id, role').eq('user_id', user.id)
    ])

    if (isOwner) {
        // OWNER HAS FULL OVERRIDE
        const allCompIds = companies?.map(c => c.id) || []
        const allDeptIds = departments?.map(d => d.id) || []
        const allProjIds = projects?.map(p => p.id) || []

        return {
            isOwner: true,
            isCEO: true,
            isDepartmentHead: true,
            isProjectLeader: true,
            canManageAny: true,
            managedCompanyIds: allCompIds,
            managedDepartmentIds: allDeptIds,
            managedProjectIds: allProjIds,
            accessibleCompanyIds: allCompIds,
            accessibleDepartmentIds: allDeptIds,
            allMemberProjIds: allProjIds
        }
    }

    // Regular RBAC
    const managedCompanyIds = roles?.filter(r => r.role === 'CEO' && r.scope_type === 'company').map(r => r.scope_id) || []
    const isCEO = managedCompanyIds.length > 0
    const finalManagedDeptIds = roles?.filter(r => r.role === 'DepartmentHead').map(r => r.scope_id) || []
    const isDepartmentHead = finalManagedDeptIds.length > 0
    const finalManagedProjIds = memberships?.filter(m => m.role === 'ProjectLeader').map(m => m.project_id) || []
    const isProjectLeader = finalManagedProjIds.length > 0
    const allMemberProjIds = memberships?.map(m => m.project_id) || []

    const accessibleCompanyIds = Array.from(new Set([
        ...managedCompanyIds,
        ...(roles?.filter(r => r.scope_type === 'company' && r.role === 'User').map(r => r.scope_id) || []),
    ]))

    return {
        isOwner: false,
        isCEO,
        isDepartmentHead,
        isProjectLeader,
        canManageAny: isCEO || isDepartmentHead || isProjectLeader,
        managedCompanyIds,
        managedDepartmentIds: finalManagedDeptIds,
        managedProjectIds: finalManagedProjIds,
        accessibleCompanyIds,
        accessibleDepartmentIds: finalManagedDeptIds,
        allMemberProjIds
    }
}
