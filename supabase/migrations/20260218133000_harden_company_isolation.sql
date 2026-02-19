-- Migration: 20260218133000_harden_company_isolation.sql
-- Description: Restrict project and company visibility to only those the user is assigned to.

-- 1. HARDEN COMPANIES RLS
DROP POLICY IF EXISTS "Users can view companies in their tenant" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;

CREATE POLICY "Users can view companies they belong to"
ON public.companies FOR SELECT
USING (
    -- 1. Tenant Owner can see everything in tenant
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.companies.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- 2. User has an explicit role in this company (CEO, Admin, User)
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.companies.id
    )
    OR
    -- 3. User is a member of at least one project in this company
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.project_memberships pm ON pm.project_id = p.id
        WHERE p.company_id = public.companies.id
        AND pm.user_id = auth.uid()
    )
);

-- 2. HARDEN PROJECTS RLS
DROP POLICY IF EXISTS "Users can view projects in their tenant" ON public.projects;
DROP POLICY IF EXISTS "Users can view assigned projects or company projects" ON public.projects;

CREATE POLICY "Users can view assigned projects or company projects"
ON public.projects FOR SELECT
USING (
    -- 1. Tenant Owner
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.projects.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- 2. User has a role in the parent company
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.projects.company_id
    )
    OR
    -- 3. User is an explicit member of this project
    EXISTS (
        SELECT 1 FROM public.project_memberships pm
        WHERE pm.user_id = auth.uid()
        AND pm.project_id = public.projects.id
    )
);

-- 3. HARDEN DEPARTMENTS RLS
DROP POLICY IF EXISTS "Users can view departments in their tenant" ON public.departments;
DROP POLICY IF EXISTS "Users can view departments they belong to" ON public.departments;

CREATE POLICY "Users can view departments they belong to"
ON public.departments FOR SELECT
USING (
    -- 1. Tenant Owner
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.departments.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- 2. User has a role in the parent company
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.departments.company_id
    )
    OR
    -- 3. User has a role in this specific department
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'department'
        AND ura.scope_id = public.departments.id
    )
);
