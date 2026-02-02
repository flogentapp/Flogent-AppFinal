-- Final Onboarding Fix: Drop old versions and recreate
-- Dropping potential old signatures to ensure clean replacement
DROP FUNCTION IF EXISTS public.onboard_new_tenant(jsonb);
DROP FUNCTION IF EXISTS public.onboard_new_tenant(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.onboard_new_tenant(payload jsonb)
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
    
    -- Extract values from payload
    v_first_name TEXT := payload->>'first_name';
    v_last_name TEXT := payload->>'last_name';
    v_company_name TEXT := payload->>'company_name';
    v_tenant_name TEXT := COALESCE(payload->>'organization_name', payload->>'company_name');
    v_tenant_slug TEXT := payload->>'slug';
BEGIN
    -- 0. Set Bypass Flag for Triggers
    PERFORM set_config('app.is_onboarding', 'true', true);

    -- 1. Get current user ID from Auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'auth.uid() is null - onboarding must be called by an authenticated user';
    END IF;

    -- 2. Validate required data
    IF v_tenant_name IS NULL OR v_tenant_name = '' THEN
        RAISE EXCEPTION 'Tenant name is required';
    END IF;

    -- 3. Create Tenant
    INSERT INTO tenants (
        name,
        slug,
        owner_user_id,
        status,
        created_by
    ) VALUES (
        v_tenant_name,
        v_tenant_slug,
        v_user_id,
        'active',
        NULL
    ) RETURNING id INTO v_tenant_id;

    -- 4. Create Company
    INSERT INTO companies (
        tenant_id,
        name,
        status,
        created_by
    ) VALUES (
        v_tenant_id,
        v_company_name,
        'active',
        NULL
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
        v_first_name,
        v_last_name,
        'active',
        v_user_id,
        v_company_id
    )
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        first_name = v_first_name,
        last_name = v_last_name,
        status = 'active',
        current_company_id = v_company_id;

    -- 6. Update Tenant and Company
    UPDATE tenants SET created_by = v_user_id WHERE id = v_tenant_id;
    UPDATE companies SET created_by = v_user_id WHERE id = v_company_id;

    -- 7. Create Default Department
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

    -- 8. Assign CEO Role (CORRECTED)
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

    -- 9. Prepare result
    v_result := jsonb_build_object(
        'tenant_id', v_tenant_id,
        'company_id', v_company_id
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
