-- Create Planner Tasks Table with explicit FK names for join safety
CREATE TABLE IF NOT EXISTS public.planner_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assigned_to_id UUID CONSTRAINT fk_planner_assignee REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'New',
    start_by DATE,
    notes JSONB DEFAULT '[]'::jsonb,
    created_by UUID CONSTRAINT fk_planner_creator REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    marked_done_by_id UUID CONSTRAINT fk_planner_completer REFERENCES public.profiles(id),
    deleted_at TIMESTAMPTZ,
    deleted_by_id UUID CONSTRAINT fk_planner_deleter REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can see tasks for their tenant" ON public.planner_tasks;
CREATE POLICY "Users can see tasks for their tenant"
ON public.planner_tasks
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert tasks for their tenant" ON public.planner_tasks;
CREATE POLICY "Users can insert tasks for their tenant"
ON public.planner_tasks
FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update tasks for their tenant" ON public.planner_tasks;
CREATE POLICY "Users can update tasks for their tenant"
ON public.planner_tasks
FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete tasks for their tenant" ON public.planner_tasks;
CREATE POLICY "Users can delete tasks for their tenant"
ON public.planner_tasks
FOR DELETE
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexing
CREATE INDEX IF NOT EXISTS idx_planner_tasks_tenant ON public.planner_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_project ON public.planner_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_assigned ON public.planner_tasks(assigned_to_id);
