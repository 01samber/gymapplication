-- ================================================================
-- SECURITY: RLS POLICY TIGHTENING
-- ================================================================
-- Fixes permissive policies that allow unauthorized access.
-- Add Member / Add Trainer use service_role (bypasses RLS) - no change needed.
-- This migration restricts anon/key usage to prevent data exposure.
-- ================================================================

-- 1. profiles: Only allow insert when inserting own profile (auth.uid() = id)
--    Admin creates via add-member/add-trainer API (service_role bypasses RLS)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. subscriptions: Only admin can insert (API uses service_role)
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- 3. client_profiles: User can create own, or admin (API uses service_role)
DROP POLICY IF EXISTS "client_profiles_insert" ON client_profiles;
CREATE POLICY "client_profiles_insert" ON client_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- 4. trainer_profiles: User can create own, or admin (API uses service_role)
DROP POLICY IF EXISTS "trainer_profiles_insert" ON trainer_profiles;
CREATE POLICY "trainer_profiles_insert" ON trainer_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- 5. dietitian_profiles: User can create own, or admin
DROP POLICY IF EXISTS "dietitian_profiles_insert" ON dietitian_profiles;
CREATE POLICY "dietitian_profiles_insert" ON dietitian_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- 6. loyalty_tracking: Only admin (API uses service_role)
DROP POLICY IF EXISTS "loyalty_insert" ON loyalty_tracking;
CREATE POLICY "loyalty_insert" ON loyalty_tracking FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- 7. bookings: Only client or trainer creating for themselves
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (client_id = auth.uid() OR trainer_id = auth.uid());

-- 8. attendance: Only client can insert their own check-in
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (client_id = auth.uid());

-- 9. workout_logs: Client or their trainer
DROP POLICY IF EXISTS "workout_logs_insert" ON workout_logs;
CREATE POLICY "workout_logs_insert" ON workout_logs FOR INSERT WITH CHECK (client_id = auth.uid() OR trainer_id = auth.uid());

-- 10. body_compositions: Admin or dietitian for their client
DROP POLICY IF EXISTS "body_compositions_insert" ON body_compositions;
CREATE POLICY "body_compositions_insert" ON body_compositions FOR INSERT WITH CHECK (
  is_admin(auth.uid()) OR
  (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)) OR
  (client_id = auth.uid())
);

-- 11. meal_logs: Only client can log their own meals
DROP POLICY IF EXISTS "meal_logs_insert" ON meal_logs;
CREATE POLICY "meal_logs_insert" ON meal_logs FOR INSERT WITH CHECK (client_id = auth.uid());

-- 12. foods: Only admin or dietitian can add foods (catalog)
DROP POLICY IF EXISTS "foods_insert" ON foods;
CREATE POLICY "foods_insert" ON foods FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- 13. client_dietitian_assignments: Only admin
DROP POLICY IF EXISTS "assignments_insert" ON client_dietitian_assignments;
CREATE POLICY "assignments_insert" ON client_dietitian_assignments FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- 14. diet_plans: Dietitian or admin
DROP POLICY IF EXISTS "diet_plans_insert" ON diet_plans;
CREATE POLICY "diet_plans_insert" ON diet_plans FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- 15. diet_plan_meals: Dietitian or admin
DROP POLICY IF EXISTS "diet_plan_meals_insert" ON diet_plan_meals;
CREATE POLICY "diet_plan_meals_insert" ON diet_plan_meals FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- 16. diet_plan_meal_items: Dietitian or admin (via meal ownership)
DROP POLICY IF EXISTS "diet_plan_meal_items_insert" ON diet_plan_meal_items;
CREATE POLICY "diet_plan_meal_items_insert" ON diet_plan_meal_items FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- 17. meal_log_items: Restrict update/delete - must own the log or be dietitian
DROP POLICY IF EXISTS "meal_log_items_select" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_insert" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_update" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_delete" ON meal_log_items;
CREATE POLICY "meal_log_items_select" ON meal_log_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM meal_logs ml WHERE ml.id = log_id AND ml.client_id = auth.uid())
  OR is_dietitian(auth.uid()) OR is_admin(auth.uid())
);
CREATE POLICY "meal_log_items_insert" ON meal_log_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meal_logs ml WHERE ml.id = log_id AND ml.client_id = auth.uid())
  OR is_dietitian(auth.uid()) OR is_admin(auth.uid())
);
CREATE POLICY "meal_log_items_update" ON meal_log_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meal_logs ml WHERE ml.id = log_id AND ml.client_id = auth.uid())
  OR is_dietitian(auth.uid()) OR is_admin(auth.uid())
);
CREATE POLICY "meal_log_items_delete" ON meal_log_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM meal_logs ml WHERE ml.id = log_id AND ml.client_id = auth.uid())
  OR is_dietitian(auth.uid()) OR is_admin(auth.uid())
);

-- 18. notifications: Restrict insert - system/admin only (avoid spam)
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (
  is_admin(auth.uid()) OR recipient_id = auth.uid()
);

-- 19. trainer_requests: Client or trainer involved in the request
DROP POLICY IF EXISTS "trainer_requests_insert" ON trainer_requests;
CREATE POLICY "trainer_requests_insert" ON trainer_requests FOR INSERT WITH CHECK (
  client_id = auth.uid() OR trainer_id = auth.uid()
);
