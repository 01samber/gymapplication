-- =====================================================
-- DIET PLAN ENHANCEMENTS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add cheat_days column to diet_plans
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS cheat_days TEXT[];

-- 2. Add plan_type column (weekly or monthly)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'diet_plans' AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE diet_plans ADD COLUMN plan_type TEXT DEFAULT 'weekly';
    END IF;
END
$$;

-- 3. Create meal commitment tracking table for clients
CREATE TABLE IF NOT EXISTS meal_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    commitment_date DATE NOT NULL,
    is_committed BOOLEAN DEFAULT FALSE,
    committed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, meal_id, commitment_date)
);

-- 4. Create daily plan tracking table
CREATE TABLE IF NOT EXISTS daily_plan_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    tracking_date DATE NOT NULL,
    total_calories_consumed INTEGER DEFAULT 0,
    total_protein_g DECIMAL(6,2) DEFAULT 0,
    total_carbs_g DECIMAL(6,2) DEFAULT 0,
    total_fat_g DECIMAL(6,2) DEFAULT 0,
    meals_completed INTEGER DEFAULT 0,
    total_meals INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    is_cheat_day BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, plan_id, tracking_date)
);

-- 5. Add day_number to diet_plan_meals for daily scheduling
ALTER TABLE diet_plan_meals ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1;
ALTER TABLE diet_plan_meals ADD COLUMN IF NOT EXISTS specific_date DATE;

-- 6. Enable RLS on new tables
ALTER TABLE meal_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_tracking ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist, then create new ones
-- meal_commitments policies
DROP POLICY IF EXISTS "meal_commitments_select_own" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_select_dietitian" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_select_admin" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_insert" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_update" ON meal_commitments;

CREATE POLICY "meal_commitments_select_own" ON meal_commitments 
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "meal_commitments_select_dietitian" ON meal_commitments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM client_dietitian_assignments 
            WHERE client_id = meal_commitments.client_id 
            AND dietitian_id = auth.uid()
        )
    );
CREATE POLICY "meal_commitments_select_admin" ON meal_commitments 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "meal_commitments_insert" ON meal_commitments 
    FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "meal_commitments_update" ON meal_commitments 
    FOR UPDATE USING (client_id = auth.uid());

-- daily_plan_tracking policies
DROP POLICY IF EXISTS "daily_plan_tracking_select_own" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_select_dietitian" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_select_admin" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_insert" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_update" ON daily_plan_tracking;

CREATE POLICY "daily_plan_tracking_select_own" ON daily_plan_tracking 
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "daily_plan_tracking_select_dietitian" ON daily_plan_tracking 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM client_dietitian_assignments 
            WHERE client_id = daily_plan_tracking.client_id 
            AND dietitian_id = auth.uid()
        )
    );
CREATE POLICY "daily_plan_tracking_select_admin" ON daily_plan_tracking 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "daily_plan_tracking_insert" ON daily_plan_tracking 
    FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "daily_plan_tracking_update" ON daily_plan_tracking 
    FOR UPDATE USING (TRUE);

-- 8. Create indexes for performance (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_meal_commitments_client ON meal_commitments(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_commitments_date ON meal_commitments(commitment_date);
CREATE INDEX IF NOT EXISTS idx_daily_plan_tracking_client ON daily_plan_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_tracking_date ON daily_plan_tracking(tracking_date);
CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_day ON diet_plan_meals(day_number);

-- 9. Verify changes
SELECT 'SUCCESS: Diet plan enhancements applied!' as result;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diet_plans' 
AND column_name IN ('cheat_days', 'plan_type')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diet_plan_meals' 
AND column_name IN ('day_number', 'specific_date')
ORDER BY column_name;
