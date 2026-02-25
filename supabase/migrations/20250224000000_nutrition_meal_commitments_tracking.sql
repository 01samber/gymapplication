-- ================================================================
-- NUTRITION: meal_commitments and daily_plan_tracking
-- ================================================================
-- Tables used by Flutter nutrition app and admin Client Nutrition page
-- ================================================================

-- 1. meal_commitments - client commitment to follow a meal on a plan
CREATE TABLE IF NOT EXISTS meal_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    commitment_date DATE NOT NULL,
    is_committed BOOLEAN DEFAULT FALSE NOT NULL,
    committed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, plan_id, meal_id, commitment_date)
);

CREATE INDEX IF NOT EXISTS idx_meal_commitments_client_plan ON meal_commitments(client_id, plan_id);
ALTER TABLE meal_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_commitments_select_own" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_select_admin" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_select_dietitian" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_insert" ON meal_commitments;
DROP POLICY IF EXISTS "meal_commitments_update" ON meal_commitments;
CREATE POLICY "meal_commitments_select_own" ON meal_commitments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "meal_commitments_select_admin" ON meal_commitments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "meal_commitments_select_dietitian" ON meal_commitments FOR SELECT USING (
    is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)
);
CREATE POLICY "meal_commitments_insert" ON meal_commitments FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "meal_commitments_update" ON meal_commitments FOR UPDATE USING (client_id = auth.uid());

DROP TRIGGER IF EXISTS update_meal_commitments_updated_at ON meal_commitments;
CREATE TRIGGER update_meal_commitments_updated_at BEFORE UPDATE ON meal_commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. daily_plan_tracking - daily summary of plan adherence
CREATE TABLE IF NOT EXISTS daily_plan_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    tracking_date DATE NOT NULL,
    total_calories_consumed INTEGER DEFAULT 0,
    total_protein_g DECIMAL(5,2) DEFAULT 0,
    total_carbs_g DECIMAL(5,2) DEFAULT 0,
    total_fat_g DECIMAL(5,2) DEFAULT 0,
    meals_completed INTEGER DEFAULT 0,
    total_meals INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    is_cheat_day BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, plan_id, tracking_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_tracking_client_plan ON daily_plan_tracking(client_id, plan_id);
ALTER TABLE daily_plan_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_plan_tracking_select_own" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_select_admin" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_select_dietitian" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_insert" ON daily_plan_tracking;
DROP POLICY IF EXISTS "daily_plan_tracking_update" ON daily_plan_tracking;
CREATE POLICY "daily_plan_tracking_select_own" ON daily_plan_tracking FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "daily_plan_tracking_select_admin" ON daily_plan_tracking FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "daily_plan_tracking_select_dietitian" ON daily_plan_tracking FOR SELECT USING (
    is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)
);
CREATE POLICY "daily_plan_tracking_insert" ON daily_plan_tracking FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "daily_plan_tracking_update" ON daily_plan_tracking FOR UPDATE USING (client_id = auth.uid());

DROP TRIGGER IF EXISTS update_daily_plan_tracking_updated_at ON daily_plan_tracking;
CREATE TRIGGER update_daily_plan_tracking_updated_at BEFORE UPDATE ON daily_plan_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Add optional columns to body_compositions (for admin UI)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'body_compositions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'basal_metabolic_rate') THEN
      ALTER TABLE body_compositions ADD COLUMN basal_metabolic_rate INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'visceral_fat_level') THEN
      ALTER TABLE body_compositions ADD COLUMN visceral_fat_level INTEGER;
    END IF;
  END IF;
END $$;
