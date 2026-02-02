-- FIX PROJECT MEMBERSHIPS RLS POLICIES
-- This migration drops restrictive (broken) policies and implements proper
-- tenant-aware, role-based access control for project assignments.

-- 1. DROP EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Users can insert their own project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can create project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can update project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can delete project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Authorized users can assign project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Users can view project memberships they have access to" ON project_memberships;
DROP POLICY IF EXISTS "Authorized users can update project memberships" ON project_memberships;
DROP POLICY IF EXISTS "Authorized users can delete project memberships" ON project_memberships;

-- 2. ENABLE RLS (Just in case)
ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;

-- 3. CREATE HELPER FUNCTIONS (If they don't exist, to keep policies clean)
-- Note: Logic is embedded in policies for performance/simplicity in this fix, 
-- mimicking the audit prompt's sophisticated SQL.

-- 4. INSERT POLICY
-- Who can add users to projects?
-- - Tenant Owner (God mode for tenant)
-- - CEO (Company wide)
-- - Department Head (Department wide)
-- - Project Leader (Only their projects, and can only add 'User' role, not other leaders)

CREATE POLICY "Authorized users can assign project memberships"
ON project_memberships
FOR INSERT
WITH CHECK (
    -- 1. Tenant Owner
    EXISTS (
        SELECT 1 FROM profiles
        JOIN tenants ON tenants.id = profiles.tenant_id
        WHERE profiles.id = auth.uid()
        AND tenants.owner_user_id = auth.uid()
    )
    OR
    -- 2. CEO (Company Scope)
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_role_assignments ura ON ura.scope_id = p.company_id
        WHERE p.id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
        AND ura.scope_type = 'company'
    )
    OR
    -- 3. Department Head (Department Scope)
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
        AND ura.scope_type = 'department'
    )
    OR
    -- 4. Project Leader (Project Scope - Add Users Only)
    (
        EXISTS (
            SELECT 1 FROM project_memberships pm
            WHERE pm.project_id = project_memberships.project_id
            AND pm.user_id = auth.uid()
            AND pm.role = 'ProjectLeader'
        )
        AND project_memberships.role = 'User' 
    )
);

-- 5. SELECT POLICY
-- Who can see memberships?
-- - The user themselves
-- - Anyone who can MANAGE the project (Owner, CEO, DeptHead, ProjectLeader)

CREATE POLICY "Users can view project memberships"
ON project_memberships
FOR SELECT
USING (
    -- Can see own membership
    user_id = auth.uid()
    OR
    -- Can see if they are Tenant Owner
    EXISTS (
        SELECT 1 FROM profiles
        JOIN tenants ON tenants.id = profiles.tenant_id
        WHERE profiles.id = auth.uid()
        AND tenants.owner_user_id = auth.uid()
    )
    OR
    -- Can see if they are CEO
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_role_assignments ura ON ura.scope_id = p.company_id
        WHERE p.id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
    )
    OR
    -- Can see if they are Dept Head
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
    )
    OR
    -- Can see if they are Project Leader
    EXISTS (
        SELECT 1 FROM project_memberships pm
        WHERE pm.project_id = project_memberships.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'ProjectLeader'
    )
);

-- 6. UPDATE POLICY
-- Similar to INSERT, but explicit for updates
CREATE POLICY "Authorized users can update project memberships"
ON project_memberships
FOR UPDATE
USING (
    -- Tenant Owner
    EXISTS (
        SELECT 1 FROM profiles
        JOIN tenants ON tenants.id = profiles.tenant_id
        WHERE profiles.id = auth.uid()
        AND tenants.owner_user_id = auth.uid()
    )
    OR
    -- CEO
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_role_assignments ura ON ura.scope_id = p.company_id
        WHERE p.id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
    )
    OR
    -- Dept Head
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
    )
    -- Note: Project Leaders generally SHOULD NOT change roles of others (e.g. promote to leader), 
    -- but if required, add it here. For now, restricting to upper management.
)
WITH CHECK (
    -- Re-verify logic on the new row state
    EXISTS (
        SELECT 1 FROM profiles
        JOIN tenants ON tenants.id = profiles.tenant_id
        WHERE profiles.id = auth.uid()
        AND tenants.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_role_assignments ura ON ura.scope_id = p.company_id
        WHERE p.id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
    )
    OR
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
    )
);

-- 7. DELETE POLICY
-- Who can remove users? Same as Update/Insert
CREATE POLICY "Authorized users can delete project memberships"
ON project_memberships
FOR DELETE
USING (
    -- Tenant Owner
    EXISTS (
        SELECT 1 FROM profiles
        JOIN tenants ON tenants.id = profiles.tenant_id
        WHERE profiles.id = auth.uid()
        AND tenants.owner_user_id = auth.uid()
    )
    OR
    -- CEO
    EXISTS (
        SELECT 1 FROM projects p
        JOIN user_role_assignments ura ON ura.scope_id = p.company_id
        WHERE p.id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
    )
    OR
    -- Dept Head
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_memberships.project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
    )
    OR
    -- Project Leader can remove USERS
    (
        EXISTS (
            SELECT 1 FROM project_memberships pm
            WHERE pm.project_id = project_memberships.project_id
            AND pm.user_id = auth.uid()
            AND pm.role = 'ProjectLeader'
        )
        AND project_memberships.role = 'User'
    )
);
