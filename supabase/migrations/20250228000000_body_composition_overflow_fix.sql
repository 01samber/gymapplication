-- ================================================================
-- FIX: numeric field overflow in body_compositions
-- - Add missing segmental & extended columns from dietitian form
-- - Widen bmi/percent_body_fat for edge cases
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'body_compositions') THEN
    RETURN;
  END IF;

  -- Widen bmi and percent_body_fat (DECIMAL(4,2) max 99.99 → DECIMAL(5,2) max 999.99)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'bmi') THEN
    ALTER TABLE body_compositions ALTER COLUMN bmi TYPE DECIMAL(5,2);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'percent_body_fat') THEN
    ALTER TABLE body_compositions ALTER COLUMN percent_body_fat TYPE DECIMAL(5,2);
  END IF;

  -- Segmental lean (kg) - use DECIMAL(5,2) for values up to 999.99
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'left_arm_lean_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN left_arm_lean_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'right_arm_lean_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN right_arm_lean_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'trunk_lean_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN trunk_lean_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'left_leg_lean_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN left_leg_lean_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'right_leg_lean_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN right_leg_lean_kg DECIMAL(5,2);
  END IF;

  -- Segmental fat (kg)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'left_arm_fat_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN left_arm_fat_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'right_arm_fat_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN right_arm_fat_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'trunk_fat_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN trunk_fat_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'left_leg_fat_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN left_leg_fat_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'right_leg_fat_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN right_leg_fat_kg DECIMAL(5,2);
  END IF;

  -- Research / extended fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'fat_free_mass_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN fat_free_mass_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'waist_hip_ratio') THEN
    ALTER TABLE body_compositions ADD COLUMN waist_hip_ratio DECIMAL(4,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'metabolic_age') THEN
    ALTER TABLE body_compositions ADD COLUMN metabolic_age INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'target_weight_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN target_weight_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'weight_control_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN weight_control_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'fat_control_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN fat_control_kg DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'body_compositions' AND column_name = 'muscle_control_kg') THEN
    ALTER TABLE body_compositions ADD COLUMN muscle_control_kg DECIMAL(5,2);
  END IF;

END $$;
