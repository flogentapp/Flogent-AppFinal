
-- Master Setup for "Go Crazy" Testing
CREATE OR REPLACE FUNCTION public.setup_wild_test(p_email TEXT, p_first_name TEXT, p_last_name TEXT, p_company_name TEXT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_company_id UUID;
    v_dept1_id UUID;
    v_dept2_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users', p_email;
    END IF;

    -- 2. Create Tenant
    INSERT INTO tenants (name, slug, owner_user_id, status)
    VALUES (p_company_name || ' Organization', 'wild-test-' || floor(random()*10000)::text, v_user_id, 'active')
    RETURNING id INTO v_tenant_id;

    -- 3. Create Company
    INSERT INTO companies (tenant_id, name, status, created_by)
    VALUES (v_tenant_id, p_company_name, 'active', v_user_id)
    RETURNING id INTO v_company_id;

    -- 4. Create Profile
    INSERT INTO profiles (id, tenant_id, email, first_name, last_name, status, onboarded, current_company_id)
    VALUES (v_user_id, v_tenant_id, p_email, p_first_name, p_last_name, 'active', true, v_company_id)
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        current_company_id = v_company_id,
        onboarded = true,
        status = 'active';

    -- 5. Create Departments
    INSERT INTO departments (tenant_id, company_id, name, status, created_by)
    VALUES (v_tenant_id, v_company_id, 'Engineering', 'active', v_user_id)
    RETURNING id INTO v_dept1_id;

    INSERT INTO departments (tenant_id, company_id, name, status, created_by)
    VALUES (v_tenant_id, v_company_id, 'Design', 'active', v_user_id)
    RETURNING id INTO v_dept2_id;

    -- 6. Create Projects
    INSERT INTO projects (tenant_id, company_id, department_id, name, code, status, created_by)
    VALUES 
        (v_tenant_id, v_company_id, v_dept1_id, 'Rocket Science', 'RS-01', 'active', v_user_id),
        (v_tenant_id, v_company_id, v_dept2_id, 'Visual Identity', 'VI-02', 'active', v_user_id);

    -- 7. Assign CEO Role
    INSERT INTO user_role_assignments (user_id, role, scope_type, scope_id, tenant_id, created_by)
    VALUES (v_user_id, 'CEO', 'company', v_company_id, v_tenant_id, v_user_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
