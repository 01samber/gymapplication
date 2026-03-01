-- ================================================================
-- CLIENT LOGIN MAINTENANCE
-- ================================================================
-- Ensures users with subscriptions or intended as clients can log in:
-- 1. Backfill price_usd for subscriptions missing it (for correct revenue)
-- 2. Ensure profiles have role='client' when they have client_profiles or subscriptions
-- 3. Ensure client_profiles exist for all subscription holders (so Flutter routing works)
-- 4. Document: Admin-added members use temp password SweatBoxWelcome1!
-- ================================================================

-- 1. Backfill price_usd from plan defaults (subscriptions created before price_usd existed)
UPDATE subscriptions s
SET price_usd = CASE s.subscription_type
  WHEN 'open_gym' THEN 75
  WHEN 'normal_gym' THEN 150
  WHEN 'with_pt' THEN 350
  WHEN 'with_dietitian' THEN 300
  WHEN 'premium' THEN 550
  ELSE COALESCE(s.price_usd, 150)
END
WHERE s.price_usd IS NULL OR s.price_usd = 0;

-- 2. Ensure role='client' for anyone with client_profiles or subscriptions
UPDATE profiles p
SET role = 'client'
WHERE p.role IS DISTINCT FROM 'client'
  AND (
    EXISTS (SELECT 1 FROM client_profiles cp WHERE cp.user_id = p.id)
    OR EXISTS (SELECT 1 FROM subscriptions s WHERE s.client_id = p.id)
  );

-- 3. Create client_profiles for subscription holders who don't have one
-- (In case subscriptions were created manually without client_profiles)
INSERT INTO client_profiles (user_id)
SELECT s.client_id
FROM subscriptions s
WHERE NOT EXISTS (SELECT 1 FROM client_profiles cp WHERE cp.user_id = s.client_id)
ON CONFLICT (user_id) DO NOTHING;
