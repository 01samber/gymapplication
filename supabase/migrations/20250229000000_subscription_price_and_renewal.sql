-- Add price_usd to subscriptions for tracking (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'price_usd'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN price_usd DECIMAL(10,2);
    -- Backfill from tier if possible
    UPDATE subscriptions s SET price_usd = t.monthly_price
    FROM subscription_tiers t WHERE s.tier_id = t.id AND s.price_usd IS NULL;
  END IF;
END $$;
