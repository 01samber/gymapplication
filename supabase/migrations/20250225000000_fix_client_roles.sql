-- Ensure users with client_profiles or subscriptions have role='client' in profiles
-- Fixes "No clients found" when client was created manually or role is wrong
UPDATE profiles p
SET role = 'client'
WHERE p.role IS DISTINCT FROM 'client'
  AND (
    EXISTS (SELECT 1 FROM client_profiles cp WHERE cp.user_id = p.id)
    OR EXISTS (SELECT 1 FROM subscriptions s WHERE s.client_id = p.id)
  );
