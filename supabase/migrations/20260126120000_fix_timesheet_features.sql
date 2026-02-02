-- FIX: Timesheet Approvals & Reports (Final)

-- 1. DROP Existing Functions (Fixes return type error)
DROP FUNCTION IF EXISTS public.approve_time_entry(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_time_entry(UUID, UUID, TEXT);

-- 2. RPC: Approve
CREATE OR REPLACE FUNCTION public.approve_time_entry(p_entry_id UUID, p_approved_by UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE time_entries
    SET status = 'approved', approved_by = p_approved_by, approved_at = now()
    WHERE id = p_entry_id;
END;
$$;

-- 3. RPC: Reject
CREATE OR REPLACE FUNCTION public.reject_time_entry(p_entry_id UUID, p_rejected_by UUID, p_rejection_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE time_entries
    SET status = 'rejected', rejected_by = p_rejected_by, rejection_reason = p_rejection_reason, updated_at = now()
    WHERE id = p_entry_id;
END;
$$;

-- 4. RLS: View Permissions
-- Allow Managers to see entries for Reports
DROP POLICY IF EXISTS "Management can view time entries" ON time_entries;

CREATE POLICY "Management can view time entries"
ON time_entries FOR SELECT
USING (
    -- 1. Tenant Owners
    EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = time_entries.tenant_id 
        AND owner_user_id = auth.uid()
    )
    OR
    -- 2. Project Leaders
    EXISTS (
        SELECT 1 FROM project_memberships 
        WHERE project_id = time_entries.project_id 
        AND user_id = auth.uid()
        AND role = 'ProjectLeader'
    )
    OR
    -- 3. Management Roles (CEO, Dept Head)
    EXISTS (
        SELECT 1 FROM user_role_assignments
        WHERE user_id = auth.uid()
        AND (
            (scope_type = 'company' AND scope_id IN (
                SELECT company_id FROM projects WHERE id = time_entries.project_id
            ))
            OR
            (scope_type = 'department' AND scope_id IN (
                SELECT department_id FROM projects WHERE id = time_entries.project_id
            ))
        )
    )
);
