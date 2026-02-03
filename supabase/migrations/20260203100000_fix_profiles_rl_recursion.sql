
-- FIX: Recursive RLS on Profiles
-- 1. Add direct policy for own profile (This breaks the recursion)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (
    id = auth.uid()
);

-- 2. Update existing policy to be more explicit
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
CREATE POLICY "Users can view profiles in their tenant" ON profiles
FOR SELECT USING (
    tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
);

-- 3. Ensure get_my_tenant_id is truly bypassing RLS
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
