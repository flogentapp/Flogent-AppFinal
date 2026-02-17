export type UserPermissions = {
    isOwner: boolean
    isCEO: boolean
    isDepartmentHead: boolean
    isProjectLeader: boolean
    canManageAny: boolean
    managedCompanyIds: string[]
    managedDepartmentIds: string[]
    managedProjectIds: string[]
    accessibleCompanyIds: string[]
    accessibleDepartmentIds: string[]
    allMemberProjIds: string[]
}
