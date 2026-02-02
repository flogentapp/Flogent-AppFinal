-- ENFORCE DATA INTEGRITY
-- Prevention of "Orphaned" records

-- 1. Companies
-- Ensure no company exists without a tenant
-- (The user should have run the fix_my_company.sql script first, or this might fail for them)
DELETE FROM public.companies WHERE tenant_id IS NULL; 
ALTER TABLE public.companies ALTER COLUMN tenant_id SET NOT NULL;

-- 2. Projects
DELETE FROM public.projects WHERE tenant_id IS NULL;
ALTER TABLE public.projects ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Departments
DELETE FROM public.departments WHERE tenant_id IS NULL;
ALTER TABLE public.departments ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Subscription Audit
-- Ensure we track who makes changes
ALTER TABLE public.tenant_app_subscriptions ALTER COLUMN subscribed_by SET NOT NULL;
