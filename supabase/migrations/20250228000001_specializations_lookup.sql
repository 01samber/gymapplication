-- ================================================================
-- SPECIALIZATIONS LOOKUP - Link trainers/dietitians via lookup table
-- - Create specializations table
-- - Junction tables for trainer_profiles and dietitian_profiles
-- - Migrate existing TEXT[] data to lookup references
-- ================================================================

CREATE TABLE IF NOT EXISTS specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_specializations_display_order ON specializations(display_order);

-- Junction: trainers <-> specializations (IF NOT EXISTS for idempotent re-runs)
CREATE TABLE IF NOT EXISTS trainer_profile_specializations (
  trainer_profile_id UUID NOT NULL REFERENCES trainer_profiles(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (trainer_profile_id, specialization_id)
);

CREATE INDEX IF NOT EXISTS idx_tps_trainer ON trainer_profile_specializations(trainer_profile_id);
CREATE INDEX IF NOT EXISTS idx_tps_spec ON trainer_profile_specializations(specialization_id);

-- Junction: dietitians <-> specializations
CREATE TABLE IF NOT EXISTS dietitian_profile_specializations (
  dietitian_profile_id UUID NOT NULL REFERENCES dietitian_profiles(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (dietitian_profile_id, specialization_id)
);

CREATE INDEX IF NOT EXISTS idx_dps_dietitian ON dietitian_profile_specializations(dietitian_profile_id);
CREATE INDEX IF NOT EXISTS idx_dps_spec ON dietitian_profile_specializations(specialization_id);

-- Seed common specializations
INSERT INTO specializations (name, slug, display_order) VALUES
  ('Weight Training', 'weight-training', 1),
  ('Strength & Conditioning', 'strength-conditioning', 2),
  ('Weight Loss', 'weight-loss', 3),
  ('Sports Nutrition', 'sports-nutrition', 4),
  ('Cardio', 'cardio', 5),
  ('Bodybuilding', 'bodybuilding', 6),
  ('CrossFit', 'crossfit', 7),
  ('General Fitness', 'general-fitness', 8),
  ('Clinical Nutrition', 'clinical-nutrition', 9),
  ('Weight Gain', 'weight-gain', 10)
ON CONFLICT DO NOTHING;

-- Migrate existing trainer specializations (TEXT[]) to lookup
DO $$
DECLARE
  rec RECORD;
  spec_name TEXT;
  spec_id UUID;
  the_slug TEXT;
BEGIN
  FOR rec IN
    SELECT tp.id, tp.specializations
    FROM trainer_profiles tp
    WHERE tp.specializations IS NOT NULL AND array_length(tp.specializations, 1) > 0
  LOOP
    FOREACH spec_name IN ARRAY rec.specializations
    LOOP
      spec_name := TRIM(spec_name);
      IF spec_name <> '' THEN
        the_slug := lower(regexp_replace(spec_name, '\s+', '-', 'g'));
        SELECT id INTO spec_id FROM specializations WHERE slug = the_slug OR LOWER(TRIM(name)) = LOWER(spec_name) LIMIT 1;
        IF spec_id IS NULL THEN
          INSERT INTO specializations (name, slug) VALUES (spec_name, the_slug)
            ON CONFLICT DO NOTHING;
          SELECT id INTO spec_id FROM specializations WHERE slug = the_slug OR LOWER(TRIM(name)) = LOWER(spec_name) LIMIT 1;
        END IF;
        IF spec_id IS NOT NULL THEN
          INSERT INTO trainer_profile_specializations (trainer_profile_id, specialization_id)
          VALUES (rec.id, spec_id)
          ON CONFLICT DO NOTHING;
        END IF;
        spec_id := NULL;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Migrate existing dietitian specializations (TEXT[]) to lookup
DO $$
DECLARE
  rec RECORD;
  spec_name TEXT;
  spec_id UUID;
  the_slug TEXT;
BEGIN
  FOR rec IN
    SELECT dp.id, dp.specializations
    FROM dietitian_profiles dp
    WHERE dp.specializations IS NOT NULL AND array_length(dp.specializations, 1) > 0
  LOOP
    FOREACH spec_name IN ARRAY rec.specializations
    LOOP
      spec_name := TRIM(spec_name);
      IF spec_name <> '' THEN
        the_slug := lower(regexp_replace(spec_name, '\s+', '-', 'g'));
        SELECT id INTO spec_id FROM specializations WHERE slug = the_slug OR LOWER(TRIM(name)) = LOWER(spec_name) LIMIT 1;
        IF spec_id IS NULL THEN
          INSERT INTO specializations (name, slug) VALUES (spec_name, the_slug)
            ON CONFLICT DO NOTHING;
          SELECT id INTO spec_id FROM specializations WHERE slug = the_slug OR LOWER(TRIM(name)) = LOWER(spec_name) LIMIT 1;
        END IF;
        IF spec_id IS NOT NULL THEN
          INSERT INTO dietitian_profile_specializations (dietitian_profile_id, specialization_id)
          VALUES (rec.id, spec_id)
          ON CONFLICT DO NOTHING;
        END IF;
        spec_id := NULL;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- RLS for specializations (public read for lookup)
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "specializations_select_all" ON specializations;
CREATE POLICY "specializations_select_all" ON specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "specializations_insert_admin" ON specializations;
CREATE POLICY "specializations_insert_admin" ON specializations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "specializations_update_admin" ON specializations;
CREATE POLICY "specializations_update_admin" ON specializations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "specializations_delete_admin" ON specializations;
CREATE POLICY "specializations_delete_admin" ON specializations FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS for junctions (follow trainer/dietitian profile policies)
ALTER TABLE trainer_profile_specializations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tps_select" ON trainer_profile_specializations;
CREATE POLICY "tps_select" ON trainer_profile_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tps_insert_admin" ON trainer_profile_specializations;
CREATE POLICY "tps_insert_admin" ON trainer_profile_specializations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "tps_delete_admin" ON trainer_profile_specializations;
CREATE POLICY "tps_delete_admin" ON trainer_profile_specializations FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE dietitian_profile_specializations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dps_select" ON dietitian_profile_specializations;
CREATE POLICY "dps_select" ON dietitian_profile_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "dps_insert_admin" ON dietitian_profile_specializations;
CREATE POLICY "dps_insert_admin" ON dietitian_profile_specializations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "dps_delete_admin" ON dietitian_profile_specializations;
CREATE POLICY "dps_delete_admin" ON dietitian_profile_specializations FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
