-- Enable RLS on all core tables to Ensure Isolation
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- 1. Helper Function to get Current User's Tenant ID (Optimization)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Tenants Policies
-- Users can view their own tenant
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant" ON tenants
FOR SELECT USING (
    id = get_my_tenant_id()
);

-- 3. Profiles Policies
-- Users can view all profiles in their tenant (needed for lists)
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
CREATE POLICY "Users can view profiles in their tenant" ON profiles
FOR SELECT USING (
    tenant_id = get_my_tenant_id()
);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (
    id = auth.uid()
);

-- 4. Companies Policies
-- View companies in tenant
DROP POLICY IF EXISTS "Users can view companies in their tenant" ON companies;
CREATE POLICY "Users can view companies in their tenant" ON companies
FOR SELECT USING (
    tenant_id = get_my_tenant_id()
);

-- 5. Departments Policies
-- View departments in tenant
DROP POLICY IF EXISTS "Users can view departments in their tenant" ON departments;
CREATE POLICY "Users can view departments in their tenant" ON departments
FOR SELECT USING (
    tenant_id = get_my_tenant_id()
);

-- 6. Projects Policies
-- View projects in tenant (Base level access, project_memberships handles stricter visibility logic if needed)
-- Currently allowing all users in tenant to SEE projects to be assigned
DROP POLICY IF EXISTS "Users can view projects in their tenant" ON projects;
CREATE POLICY "Users can view projects in their tenant" ON projects
FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE tenant_id = get_my_tenant_id())
);

-- 7. Time Entries Policies
-- Users can view their own entries
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
CREATE POLICY "Users can view own time entries" ON time_entries
FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can insert their own entries
DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
CREATE POLICY "Users can insert own time entries" ON time_entries
FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own entries (if not approved - logic handled in app, but RLS allows update)
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
CREATE POLICY "Users can update own time entries" ON time_entries
FOR UPDATE USING (
    user_id = auth.uid()
);

-- Tenant Owners can view ALL time entries in tenant (for reports)
-- Need to join with projects -> companies -> tenant
DROP POLICY IF EXISTS "Tenant Owners can view all entries" ON time_entries;
CREATE POLICY "Tenant Owners can view all entries" ON time_entries
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = get_my_tenant_id() 
        AND owner_user_id = auth.uid()
    )
    AND
    project_id IN (
        SELECT p.id FROM projects p
        JOIN companies c ON c.id = p.company_id
        WHERE c.tenant_id = get_my_tenant_id()
    )
);
