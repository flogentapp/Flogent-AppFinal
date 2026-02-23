-- Add 'Admin' to the role_type enum
-- ALTER TYPE ... ADD VALUE is safe and does not require a table rewrite

ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'Admin';
