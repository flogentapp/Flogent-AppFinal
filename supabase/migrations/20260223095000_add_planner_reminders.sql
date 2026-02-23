-- Add columns for scheduled reminders
ALTER TABLE planner_tasks 
ADD COLUMN IF NOT EXISTS reminder_email_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_date DATE,
ADD COLUMN IF NOT EXISTS reminder_user_id UUID REFERENCES auth.users(id);
