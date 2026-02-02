-- FIX: Add missing column 'subscribed_by' to tenant_app_subscriptions

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_app_subscriptions' AND column_name = 'subscribed_by') THEN
        ALTER TABLE public.tenant_app_subscriptions ADD COLUMN subscribed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
