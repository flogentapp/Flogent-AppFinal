-- STRICT ISOLATION & ROOT CAUSE FIX
-- This migration adds "Guard Rails" to the database.
-- It ensures that even if the app code sends the wrong Tenant ID, the database rejects it or fixes it.

-- 1. Helper Function: Enforce Tenant ID on Insert
CREATE OR REPLACE FUNCTION public.force_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
    v_user_tenant_id UUID;
BEGIN
    -- Get the tenant_id of the user performing the action
    SELECT tenant_id INTO v_user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_user_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Security Violation: User has no valid tenant.';
    END IF;

    -- Force the row to belong to the user's tenant
    NEW.tenant_id := v_user_tenant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Triggers for Core Tables
-- These triggers run BEFORE every INSERT. They silently overwrite whatever 'tenant_id'
-- the client/server sent with the TRUE tenant_id from the user's secure profile.

-- Companies
DROP TRIGGER IF EXISTS trg_enforce_tenant_companies ON public.companies;
CREATE TRIGGER trg_enforce_tenant_companies
BEFORE INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.force_tenant_id();

-- Projects
DROP TRIGGER IF EXISTS trg_enforce_tenant_projects ON public.projects;
CREATE TRIGGER trg_enforce_tenant_projects
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.force_tenant_id();

-- Departments
DROP TRIGGER IF EXISTS trg_enforce_tenant_departments ON public.departments;
CREATE TRIGGER trg_enforce_tenant_departments
BEFORE INSERT ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.force_tenant_id();


-- 3. Strict INSERT RLS Policies
-- Just in case the trigger is bypassed (superusers), these policies ensure correctness.

-- Companies Insert
DROP POLICY IF EXISTS "Users can insert companies in their tenant" ON public.companies;
CREATE POLICY "Users can insert companies in their tenant" ON public.companies
FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Projects Insert
DROP POLICY IF EXISTS "Users can insert projects in their tenant" ON public.projects;
CREATE POLICY "Users can insert projects in their tenant" ON public.projects
FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Departments Insert
DROP POLICY IF EXISTS "Users can insert departments in their tenant" ON public.departments;
CREATE POLICY "Users can insert departments in their tenant" ON public.departments
FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);
