// ... inside your createCompany function ...

// 1. Create the Tenant
const { data: tenant, error: tenantError } = await supabase
  .from('tenants')
  .insert({ 
    name: formData.companyName, 
    created_by: user.id 
  })
  .select()
  .single();

if (tenantError) throw tenantError;

// 2. Link User & Assign "TenantOwner" Role
// CRITICAL: We use 'TenantOwner' to match your Approval Matrix schema
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    tenant_id: tenant.id,
    role: 'TenantOwner', // <--- EXACT SPELLING REQUIRED
    first_name: formData.firstName,
    last_name: formData.lastName
  })
  .eq('id', user.id);