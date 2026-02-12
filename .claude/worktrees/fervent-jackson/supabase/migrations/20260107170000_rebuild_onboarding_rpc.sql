-- Rebuild Onboarding RPC Function
-- DROP old version if signature changed
DROP FUNCTION IF EXISTS public.onboard_new_tenant(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.onboard_new_tenant(
    p_company_name TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_tenant_name TEXT,
    p_tenant_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_company_id UUID;
    v_dept_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Get current user ID from Auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Check if user already has a tenant (prevent duplicate onboarding)
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND tenant_id IS NOT NULL) THEN
        RAISE EXCEPTION 'User is already onboarded';
    END IF;

    -- 3. Create Tenant
    INSERT INTO tenants (
        name,
        slug,
        owner_user_id,
        status,
        created_by
    ) VALUES (
        COALESCE(p_tenant_name, p_company_name),
        p_tenant_slug,
        v_user_id,
        'active',
        v_user_id
    ) RETURNING id INTO v_tenant_id;

    -- 4. Create Company
    INSERT INTO companies (
        tenant_id,
        name,
        status,
        created_by
    ) VALUES (
        v_tenant_id,
        p_company_name,
        'active',
        v_user_id
    ) RETURNING id INTO v_company_id;

    -- 5. Upsert Profile
    INSERT INTO profiles (
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        status,
        created_by,
        current_company_id
    ) VALUES (
        v_user_id,
        v_tenant_id,
        (SELECT email FROM auth.users WHERE id = v_user_id),
        p_first_name,
        p_last_name,
        'active',
        v_user_id,
        v_company_id
    )
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        first_name = p_first_name,
        last_name = p_last_name,
        status = 'active',
        current_company_id = v_company_id;

    -- 6. Create Default Department
    INSERT INTO departments (
        tenant_id,
        company_id,
        name,
        status,
        created_by
    ) VALUES (
        v_tenant_id,
        v_company_id,
        'General',
        'active',
        v_user_id
    ) RETURNING id INTO v_dept_id;

    -- 7. Assign CEO Role (Polymorphic Scope)
    INSERT INTO user_role_assignments (
        user_id,
        role,
        scope_type,
        scope_id,
        tenant_id,
        created_by
    ) VALUES (
        v_user_id,
        'CEO',
        'company',
        v_company_id,
        v_tenant_id,
        v_user_id
    );

    -- 8. Enable Timesheets App
    INSERT INTO tenant_app_subscriptions (
        tenant_id,
        app_name,
        enabled,
        created_by
    ) VALUES (
        v_tenant_id,
        'timesheets',
        true,
        v_user_id
    );

    -- 9. Initialize Approval Policy
    INSERT INTO approval_policies (
        tenant_id,
        approvals_enabled,
        created_by
    ) VALUES (
        v_tenant_id,
        true,
        v_user_id
    );

    -- 10. Prepare result
    v_result := jsonb_build_object(
        'tenant_id', v_tenant_id,
        'company_id', v_company_id
    );

    -- Force schema reload for PostgREST
    NOTIFY pgrst, 'reload schema';

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- In case of any error, Postgres will automatically rollback the transaction
    RAISE;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.onboard_new_tenant(text, text, text, text, text) TO authenticated, anon;
