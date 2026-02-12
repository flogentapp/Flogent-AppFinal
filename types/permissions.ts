export type UserPermissions = {
    isOwner: boolean
    isCEO: boolean
    isDepartmentHead: boolean
    isProjectLeader: boolean
    canManageAny: boolean
    managedDepartmentIds: string[]
    managedProjectIds: string[]
}
