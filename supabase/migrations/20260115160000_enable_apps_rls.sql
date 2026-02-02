-- Enable RLS on App Subscriptions table
ALTER TABLE public.tenant_app_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. VIEW Policy: All members of the tenant can VIEW which apps are enabled (for Navbar/Logic)
DROP POLICY IF EXISTS "Tenant members can view apps" ON tenant_app_subscriptions;
CREATE POLICY "Tenant members can view apps" ON tenant_app_subscriptions
FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
);

-- 2. MANAGE Policy: Only Tenant Owners can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Tenant Owners can manage apps" ON tenant_app_subscriptions;
CREATE POLICY "Tenant Owners can manage apps" ON tenant_app_subscriptions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tenants 
        WHERE id = tenant_app_subscriptions.tenant_id 
        AND owner_user_id = auth.uid()
    )
);
