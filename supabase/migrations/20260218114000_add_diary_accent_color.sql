-- Add accent_color to diary_templates
ALTER TABLE public.diary_templates ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'indigo';
