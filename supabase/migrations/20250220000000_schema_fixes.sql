-- ================================================================
-- SWEATBOX GYM - SCHEMA FIXES
-- ================================================================
-- Compatibility fixes between database schema and mobile/admin/dietitian apps.
-- ================================================================

-- 1. Add open_gym to subscription_type (for backward compatibility with mobile/admin)
-- Only runs if subscription_type enum exists (skips on fresh shadow DB)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'subscription_type' AND e.enumlabel = 'open_gym') THEN
            ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'open_gym';
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add scheduled_date to bookings (mobile/admin use this; schema may have booking_date or date)
-- Only runs if bookings table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
       AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'scheduled_date'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'booking_date'
        ) THEN
            ALTER TABLE bookings RENAME COLUMN booking_date TO scheduled_date;
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'date'
        ) THEN
            ALTER TABLE bookings RENAME COLUMN date TO scheduled_date;
        ELSE
            ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
            UPDATE bookings SET scheduled_date = COALESCE(created_at::date, CURRENT_DATE);
            ALTER TABLE bookings ALTER COLUMN scheduled_date SET NOT NULL;
        END IF;
    END IF;
END $$;

-- 3. Add missing columns to exercises (workout screen expects these)
-- Only runs if exercises table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
        RETURN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'is_active') THEN
        ALTER TABLE exercises ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'is_cardio') THEN
        ALTER TABLE exercises ADD COLUMN is_cardio BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'instructions') THEN
        ALTER TABLE exercises ADD COLUMN instructions TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'tips') THEN
        ALTER TABLE exercises ADD COLUMN tips TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'secondary_muscles') THEN
        ALTER TABLE exercises ADD COLUMN secondary_muscles TEXT[];
    END IF;
END $$;

-- 4 & 5. Create workout_sessions and exercise_logs tables (used by mobile workout screen)
-- Only runs if profiles and exercises exist (skips on fresh shadow DB)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
       OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
        RETURN;
    END IF;

    DROP TABLE IF EXISTS exercise_logs CASCADE;
    DROP TABLE IF EXISTS workout_sessions CASCADE;

    CREATE TABLE workout_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMPTZ,
        duration_minutes INTEGER,
        calories_burned INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE exercise_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
        exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        workout_exercise_id UUID,
        set_number INTEGER DEFAULT 1,
        reps_target INTEGER,
        reps_completed INTEGER,
        weight_kg DECIMAL(5,2),
        duration_minutes INTEGER,
        distance_km DECIMAL(6,3),
        calories_burned INTEGER,
        is_completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workout_sessions_client ON workout_sessions(client_id);
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_started ON workout_sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON exercise_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

    ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "workout_sessions_select_own" ON workout_sessions;
    CREATE POLICY "workout_sessions_select_own" ON workout_sessions FOR SELECT USING (client_id = auth.uid());
    DROP POLICY IF EXISTS "workout_sessions_insert" ON workout_sessions;
    CREATE POLICY "workout_sessions_insert" ON workout_sessions FOR INSERT WITH CHECK (client_id = auth.uid());
    DROP POLICY IF EXISTS "workout_sessions_update" ON workout_sessions;
    CREATE POLICY "workout_sessions_update" ON workout_sessions FOR UPDATE USING (client_id = auth.uid());

    ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "exercise_logs_select" ON exercise_logs;
    CREATE POLICY "exercise_logs_select" ON exercise_logs FOR SELECT USING (
        EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = exercise_logs.session_id AND ws.client_id = auth.uid())
    );
    DROP POLICY IF EXISTS "exercise_logs_insert" ON exercise_logs;
    CREATE POLICY "exercise_logs_insert" ON exercise_logs FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = exercise_logs.session_id AND ws.client_id = auth.uid())
    );
    DROP POLICY IF EXISTS "exercise_logs_update" ON exercise_logs;
    CREATE POLICY "exercise_logs_update" ON exercise_logs FOR UPDATE USING (
        EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = exercise_logs.session_id AND ws.client_id = auth.uid())
    );
    DROP POLICY IF EXISTS "exercise_logs_delete" ON exercise_logs;
    CREATE POLICY "exercise_logs_delete" ON exercise_logs FOR DELETE USING (
        EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = exercise_logs.session_id AND ws.client_id = auth.uid())
    );
END $$;
