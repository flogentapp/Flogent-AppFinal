-- Migration: 20260218140000_strict_isolation_final.sql
-- Description: Nuke permissive RLS and implement strict role-based and context-based isolation.

-- 1. CLEANUP OLD PERMISSIVE POLICIES
-- Projects
DROP POLICY IF EXISTS "Users can view projects in their tenant" ON public.projects;
DROP POLICY IF EXISTS "Users can view assigned projects or company projects" ON public.projects;

-- Companies
DROP POLICY IF EXISTS "Users can view companies in their tenant" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;

-- Departments 
DROP POLICY IF EXISTS "Users can view departments in their tenant" ON public.departments;
DROP POLICY IF EXISTS "Users can view departments they belong to" ON public.departments;

-- 2. STRICT COMPANIES RLS
-- A user can only see a company if:
-- a) They are the Tenant Owner
-- b) They have an explicit role assignment to that company
CREATE POLICY "Strict Company Isolation"
ON public.companies FOR SELECT
USING (
    -- a) Tenant Owner
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.companies.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- b) Has any role in this company
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.companies.id
    )
    OR
    -- c) Is a member of any project in this company (needed for project members to see their parent company)
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.project_memberships pm ON pm.project_id = p.id
        WHERE p.company_id = public.companies.id
        AND pm.user_id = auth.uid()
    )
);

-- 3. STRICT DEPARTMENTS RLS
CREATE POLICY "Strict Department Isolation"
ON public.departments FOR SELECT
USING (
    -- a) Tenant Owner
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.departments.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- b) Has role in parent company
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.departments.company_id
    )
    OR
    -- c) Has role in this department
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'department'
        AND ura.scope_id = public.departments.id
    )
);

-- 4. STRICT PROJECTS RLS
CREATE POLICY "Strict Project Isolation"
ON public.projects FOR SELECT
USING (
    -- a) Tenant Owner
    EXISTS (
        SELECT 1 FROM public.tenants t 
        WHERE t.id = public.projects.tenant_id 
        AND t.owner_user_id = auth.uid()
    )
    OR
    -- b) Has role in parent company
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'company'
        AND ura.scope_id = public.projects.company_id
    )
    OR
    -- c) Has role in parent department
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.scope_type = 'department'
        AND ura.scope_id = public.projects.department_id
    )
    OR
    -- d) Is an explicit member (Project Leader, etc)
    EXISTS (
        SELECT 1 FROM public.project_memberships pm
        WHERE pm.user_id = auth.uid()
        AND pm.project_id = public.projects.id
    )
);

-- 5. Harder Profiles RLS
-- Currently people can see every profile in the tenant. Let's restrict to same company?
-- Actually, for now let's keep tenant-wide visibility for profiles but restrict it IF we want really strict isolation.
-- For a SaaS, you usually only see people in your company.
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
CREATE POLICY "Strict Profile Isolation"
ON public.profiles FOR SELECT
USING (
    -- a) Same company context
    current_company_id IN (
        SELECT scope_id FROM public.user_role_assignments 
        WHERE user_id = auth.uid() AND scope_type = 'company'
    )
    OR
    -- b) Tenant Owner
    EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND owner_user_id = auth.uid())
    OR
    -- c) I belong to the same project as them
    EXISTS (
        SELECT 1 FROM public.project_memberships pm1
        JOIN public.project_memberships pm2 ON pm1.project_id = pm2.project_id
        WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
    )
    OR
    -- d) Own profile
    id = auth.uid()
);
