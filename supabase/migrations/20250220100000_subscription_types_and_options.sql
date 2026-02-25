-- Add 4 subscription types for Add Member form (normal_gym, with_pt, with_dietitian, premium)
-- Only runs if subscription_type enum exists (skips on fresh shadow DB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'subscription_type' AND e.enumlabel = 'normal_gym') THEN
    ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'normal_gym';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'subscription_type' AND e.enumlabel = 'with_pt') THEN
    ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'with_pt';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'subscription_type' AND e.enumlabel = 'with_dietitian') THEN
    ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'with_dietitian';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'subscription_type' AND e.enumlabel = 'premium') THEN
    ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'premium';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
