-- =====================================================
-- FIX DELETE POLICIES
-- Run this in Supabase SQL Editor
-- =====================================================

-- Allow dietitians to delete diet plans they created
DROP POLICY IF EXISTS "diet_plans_delete_dietitian" ON diet_plans;
CREATE POLICY "diet_plans_delete_dietitian" ON diet_plans
    FOR DELETE USING (dietitian_id = auth.uid());

-- Allow admins to delete any diet plan
DROP POLICY IF EXISTS "diet_plans_delete_admin" ON diet_plans;
CREATE POLICY "diet_plans_delete_admin" ON diet_plans
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow dietitians to delete meals from plans they created
DROP POLICY IF EXISTS "diet_plan_meals_delete_dietitian" ON diet_plan_meals;
CREATE POLICY "diet_plan_meals_delete_dietitian" ON diet_plan_meals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM diet_plans 
            WHERE id = diet_plan_meals.plan_id 
            AND dietitian_id = auth.uid()
        )
    );

-- Allow admins to delete any meal
DROP POLICY IF EXISTS "diet_plan_meals_delete_admin" ON diet_plan_meals;
CREATE POLICY "diet_plan_meals_delete_admin" ON diet_plan_meals
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow dietitians to delete meal items from plans they created
DROP POLICY IF EXISTS "diet_plan_meal_items_delete_dietitian" ON diet_plan_meal_items;
CREATE POLICY "diet_plan_meal_items_delete_dietitian" ON diet_plan_meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM diet_plan_meals m
            JOIN diet_plans p ON m.plan_id = p.id
            WHERE m.id = diet_plan_meal_items.meal_id 
            AND p.dietitian_id = auth.uid()
        )
    );

-- Allow admins to delete any meal item
DROP POLICY IF EXISTS "diet_plan_meal_items_delete_admin" ON diet_plan_meal_items;
CREATE POLICY "diet_plan_meal_items_delete_admin" ON diet_plan_meal_items
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Verify policies created
SELECT 'Delete policies created successfully!' as result;

SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('diet_plans', 'diet_plan_meals', 'diet_plan_meal_items')
AND policyname LIKE '%delete%';
