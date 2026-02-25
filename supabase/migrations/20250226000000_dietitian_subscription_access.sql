-- Dietitian can read subscription_type for their assigned clients (to filter Nutrition/Premium only)
DROP POLICY IF EXISTS "subscriptions_select_dietitian" ON subscriptions;
CREATE POLICY "subscriptions_select_dietitian" ON subscriptions FOR SELECT USING (
  is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)
);

-- Performance: index for dietitian client filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_status_type 
ON subscriptions(client_id, status, subscription_type);
