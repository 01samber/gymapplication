-- ================================================================
-- TRAINER OFFERINGS AND REVENUE TRACKING
-- ================================================================
-- Adds trainer_offerings table and amount to bookings for revenue
-- ================================================================

-- 1. Add amount to bookings (nullable - for PT/session revenue)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'amount') THEN
    ALTER TABLE bookings ADD COLUMN amount DECIMAL(10,2);
  END IF;
END $$;

-- 2. Create trainer_offerings table
CREATE TABLE IF NOT EXISTS trainer_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    session_type TEXT DEFAULT 'pt_session',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trainer_offerings_trainer ON trainer_offerings(trainer_id);
ALTER TABLE trainer_offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_offerings_select" ON trainer_offerings;
DROP POLICY IF EXISTS "trainer_offerings_insert" ON trainer_offerings;
DROP POLICY IF EXISTS "trainer_offerings_update" ON trainer_offerings;
DROP POLICY IF EXISTS "trainer_offerings_delete" ON trainer_offerings;
CREATE POLICY "trainer_offerings_select" ON trainer_offerings FOR SELECT USING (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "trainer_offerings_insert" ON trainer_offerings FOR INSERT WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "trainer_offerings_update" ON trainer_offerings FOR UPDATE USING (trainer_id = auth.uid());
CREATE POLICY "trainer_offerings_delete" ON trainer_offerings FOR DELETE USING (trainer_id = auth.uid());

DROP TRIGGER IF EXISTS update_trainer_offerings_updated_at ON trainer_offerings;
CREATE TRIGGER update_trainer_offerings_updated_at BEFORE UPDATE ON trainer_offerings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
