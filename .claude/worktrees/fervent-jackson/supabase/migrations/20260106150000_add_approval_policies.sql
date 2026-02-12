-- Create approval_policies table
create table if not exists public.approval_policies (
    tenant_id uuid primary key references public.tenants(id) on delete cascade,
    approvals_enabled boolean not null default true,
    rules jsonb not null default '{
        "User": ["ProjectLeader", "DepartmentHead", "CEO", "TenantOwner"],
        "ProjectLeader": ["DepartmentHead", "CEO", "TenantOwner"],
        "DepartmentHead": ["CEO", "TenantOwner"],
        "CEO": ["TenantOwner"]
    }'::jsonb,
    updated_at timestamptz default now()
);

-- RLS Policies
alter table public.approval_policies enable row level security;

create policy "Tenant Owners can manage approval policies"
    on public.approval_policies
    for all
    using ( public.is_tenant_owner(tenant_id) )
    with check ( public.is_tenant_owner(tenant_id) );

create policy "Users can view approval policies"
    on public.approval_policies
    for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.tenant_id = approval_policies.tenant_id
        )
    );

-- Trigger for updated_at
create trigger handle_updated_at before update on public.approval_policies
    for each row execute procedure moddatetime (updated_at);
