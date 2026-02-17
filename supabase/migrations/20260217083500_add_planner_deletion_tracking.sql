-- Add deletion tracking to planner tasks
ALTER TABLE public.planner_tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by_id UUID CONSTRAINT fk_planner_deleter REFERENCES public.profiles(id);
