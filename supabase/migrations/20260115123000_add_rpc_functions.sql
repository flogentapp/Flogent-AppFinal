-- RPC FUNCTIONS FOR FLOGENT
-- 1. get_user_projects: Used by Timesheet Dropdown to show allowed projects
-- 2. is_tenant_owner: Used by RLS policies
-- 3. user_can_manage_project: Used by RLS policies

-- 1. get_user_projects
CREATE OR REPLACE FUNCTION get_user_projects(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    code TEXT,
    company_id UUID,
    company_name TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id,
        p.name,
        p.code,
        p.company_id,
        c.name AS company_name,
        p.status
    FROM projects p
    JOIN companies c ON c.id = p.company_id
    WHERE p.tenant_id = (SELECT tenant_id FROM profiles WHERE id = p_user_id)
    AND p.status = 'active'
    AND (
        -- Tenant owner sees all projects
        EXISTS (
            SELECT 1 FROM profiles prof
            JOIN tenants t ON t.id = prof.tenant_id
            WHERE prof.id = p_user_id
            AND t.owner_user_id = p_user_id
        )
        OR
        -- CEO sees all projects in their company
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            WHERE ura.user_id = p_user_id
            AND ura.role = 'CEO'
            AND ura.scope_type = 'company'
            AND ura.scope_id = p.company_id
        )
        OR
        -- DepartmentHead sees projects linked to their departments
        EXISTS (
            SELECT 1 FROM project_departments pd
            JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
            WHERE pd.project_id = p.id
            AND ura.user_id = p_user_id
            AND ura.role = 'DepartmentHead'
            AND ura.scope_type = 'department'
        )
        OR
        -- ProjectLeader or User sees their assigned projects
        EXISTS (
            SELECT 1 FROM project_memberships pm
            WHERE pm.project_id = p.id
            AND pm.user_id = p_user_id
        )
    )
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. is_tenant_owner
CREATE OR REPLACE FUNCTION is_tenant_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN tenants t ON t.id = p.tenant_id
    WHERE p.id = user_id
    AND t.owner_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. user_can_manage_project
CREATE OR REPLACE FUNCTION user_can_manage_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
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
        WHERE p.id = project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'CEO'
    )
    OR
    -- Dept Head
    EXISTS (
        SELECT 1 FROM project_departments pd
        JOIN user_role_assignments ura ON ura.scope_id = pd.department_id
        WHERE pd.project_id = project_id
        AND ura.user_id = auth.uid()
        AND ura.role = 'DepartmentHead'
    )
    OR
    -- Project Leader
    EXISTS (
        SELECT 1 FROM project_memberships pm
        WHERE pm.project_id = project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'ProjectLeader'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
