-- =====================================================
-- ADD CHEAT DAYS COLUMN TO DIET PLANS
-- Run this on your existing database to add cheat days support
-- =====================================================

-- Add cheat_days column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'diet_plans' AND column_name = 'cheat_days'
    ) THEN
        ALTER TABLE diet_plans ADD COLUMN cheat_days TEXT[];
        RAISE NOTICE 'Added cheat_days column to diet_plans';
    ELSE
        RAISE NOTICE 'cheat_days column already exists';
    END IF;
END
$$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diet_plans' 
AND column_name = 'cheat_days';
