export type UserPermissions = {
    isOwner: boolean
    isCEO: boolean
    isAdmin: boolean
    isDepartmentHead: boolean
    isProjectLeader: boolean
    canManageAny: boolean
    tenantId: string | null
    managedCompanyIds: string[]
    managedDepartmentIds: string[]
    managedProjectIds: string[]
    accessibleCompanyIds: string[]
    accessibleDepartmentIds: string[]
    allMemberProjIds: string[]
}
