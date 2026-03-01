-- ================================================================
-- LOYALTY: Live client rewards - 12 months = 13th FREE
-- ================================================================
-- 1. Add free_pt_months_earned/used to loyalty_tracking
-- 2. Create client_loyalty_rewards for earned free months
-- 3. RLS for new table
-- ================================================================

-- Add columns to loyalty_tracking if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_tracking' AND column_name = 'free_pt_months_earned') THEN
    ALTER TABLE loyalty_tracking ADD COLUMN free_pt_months_earned INTEGER DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_tracking' AND column_name = 'free_pt_months_used') THEN
    ALTER TABLE loyalty_tracking ADD COLUMN free_pt_months_used INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Client-earned rewards: when they hit 12 months, they get the 13th free
CREATE TABLE IF NOT EXISTS client_loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL DEFAULT 'free_month',
    months_count INTEGER NOT NULL DEFAULT 12,
    is_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    claimed_at TIMESTAMPTZ,
    subscription_id UUID REFERENCES subscriptions(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_loyalty_rewards_client ON client_loyalty_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_rewards_claimed ON client_loyalty_rewards(is_claimed);

ALTER TABLE client_loyalty_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_loyalty_rewards_select_own" ON client_loyalty_rewards;
CREATE POLICY "client_loyalty_rewards_select_own" ON client_loyalty_rewards FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "client_loyalty_rewards_select_admin" ON client_loyalty_rewards;
CREATE POLICY "client_loyalty_rewards_select_admin" ON client_loyalty_rewards FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "client_loyalty_rewards_insert_admin" ON client_loyalty_rewards;
CREATE POLICY "client_loyalty_rewards_insert_admin" ON client_loyalty_rewards FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "client_loyalty_rewards_update_admin" ON client_loyalty_rewards;
CREATE POLICY "client_loyalty_rewards_update_admin" ON client_loyalty_rewards FOR UPDATE USING (is_admin(auth.uid()));
