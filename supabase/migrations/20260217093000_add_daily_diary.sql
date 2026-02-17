-- Create Daily Diary Tables
CREATE TABLE IF NOT EXISTS public.diary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, label, type, required}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.diary_templates(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value {field_id: value}
    status TEXT DEFAULT 'Submitted', -- Draft, Submitted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date, template_id)
);

-- Enable RLS
ALTER TABLE public.diary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Templates
DROP POLICY IF EXISTS "Users can see templates for their tenant" ON public.diary_templates;
CREATE POLICY "Users can see templates for their tenant"
ON public.diary_templates FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage templates" ON public.diary_templates;
CREATE POLICY "Admins can manage templates"
ON public.diary_templates FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) 
    AND (
        EXISTS (
            SELECT 1 FROM user_role_assignments 
            WHERE user_id = auth.uid() 
            AND role IN ('CEO', 'Admin')
        )
    )
);

-- RLS Policies for Entries
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.diary_entries;
CREATE POLICY "Users can manage their own entries"
ON public.diary_entries FOR ALL
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all entries in tenant" ON public.diary_entries;
CREATE POLICY "Admins can view all entries in tenant"
ON public.diary_entries FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND (
        EXISTS (
            SELECT 1 FROM user_role_assignments 
            WHERE user_id = auth.uid() 
            AND role IN ('CEO', 'Admin', 'Project Leader')
        )
    )
);

-- Indices
CREATE INDEX idx_diary_templates_tenant ON public.diary_templates(tenant_id);
CREATE INDEX idx_diary_entries_user_date ON public.diary_entries(user_id, entry_date);
CREATE INDEX idx_diary_entries_tenant ON public.diary_entries(tenant_id);
