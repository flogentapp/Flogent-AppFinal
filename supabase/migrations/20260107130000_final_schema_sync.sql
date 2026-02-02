-- Final Schema Sync Migration
-- 1. Add current_company_id to profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN current_company_id UUID REFERENCES public.companies(id);
    END IF;
END $$;

-- 2. Drop and Recreate onboarding function
DROP FUNCTION IF EXISTS public.onboard_new_tenant(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.onboard_new_tenant(
    p_company_name TEXT,
    p_tenant_name TEXT,
    p_tenant_slug TEXT,
    p_first_name TEXT,
    p_last_name TEXT
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
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user already has a tenant
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND tenant_id IS NOT NULL) THEN
        RAISE EXCEPTION 'User is already onboarded';
    END IF;

    -- Create Tenant
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

    -- Create Company
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

    -- Upsert Profile
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

    -- Create Default Department
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

    -- Assign CEO Role (Company Scope)
    INSERT INTO user_role_assignments (
        user_id,
        role,
        scope_type,
        company_id,
        created_by
    ) VALUES (
        v_user_id,
        'CEO',
        'company',
        v_company_id,
        v_user_id
    );

    -- Enable Timesheets App
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

    -- Prepare result
    v_result := jsonb_build_object(
        'tenant_id', v_tenant_id,
        'company_id', v_company_id
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
