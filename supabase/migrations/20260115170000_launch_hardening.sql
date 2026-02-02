-- LAUNCH READINESS HARDENING
-- Fixes identified in Launch Audit

-- 1. Secure User Role Assignments (CRITICAL: Prevents privilege escalation)
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON user_role_assignments;
CREATE POLICY "Users can view own roles" ON user_role_assignments
FOR SELECT USING (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Tenant Owners can manage roles" ON user_role_assignments;
CREATE POLICY "Tenant Owners can manage roles" ON user_role_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = user_role_assignments.tenant_id 
        AND owner_user_id = auth.uid()
    )
);

-- 2. Secure Project Memberships
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project memberships" ON project_memberships;
CREATE POLICY "Users can view project memberships" ON project_memberships
FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
        -- Also allow viewing if they are a project member of the same project (Team View)
        -- Or simplistic: Allow reading all memberships in tenant (for now, simpler)
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND tenant_id = (
             SELECT tenant_id FROM projects WHERE id = project_memberships.project_id
        )
    )
);

DROP POLICY IF EXISTS "Tenant Owners can manage memberships" ON project_memberships;
CREATE POLICY "Tenant Owners can manage memberships" ON project_memberships
FOR ALL USING (
    -- owner of the tenant that owns the project
    EXISTS (
        SELECT 1 FROM projects p
        JOIN companies c ON c.id = p.company_id
        JOIN tenants t ON t.id = c.tenant_id
        WHERE p.id = project_memberships.project_id
        AND t.owner_user_id = auth.uid()
    )
);

-- 3. FIX: Allow Tenant Owners to APPROVE/REJECT Timesheets (Update)
-- Previous policy only allowed Users to update THEIR OWN entries.
DROP POLICY IF EXISTS "Tenant Owners can update all entries" ON time_entries;
CREATE POLICY "Tenant Owners can update all entries" ON time_entries
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = get_my_tenant_id() 
        AND owner_user_id = auth.uid()
    )
);
