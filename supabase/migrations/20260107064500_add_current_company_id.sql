-- Add current_company_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_company_id UUID REFERENCES companies(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_current_company ON profiles(current_company_id);
