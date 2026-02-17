-- Ensure marked_done_by_id exists and has the correct constraint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planner_tasks' AND column_name='marked_done_by_id') THEN
        ALTER TABLE public.planner_tasks ADD COLUMN marked_done_by_id UUID CONSTRAINT fk_planner_completer REFERENCES public.profiles(id);
    END IF;
END $$;
