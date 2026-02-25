-- ================================================================
-- SWEATBOX GYM - BASE SCHEMA (Idempotent)
-- ================================================================
-- Creates full app schema. Safe to run on:
-- - Fresh local DB (creates everything)
-- - Remote DB that already has schema (skips existing objects)
-- ================================================================

-- ===========================================
-- ENUMS (create only if not exist)
-- ===========================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'client', 'dietitian');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_type AS ENUM ('normal_gym', 'with_pt', 'with_dietitian', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE food_category AS ENUM ('dairy', 'protein', 'grains', 'vegetable', 'fruit', 'fats', 'nuts', 'legumes', 'beverage', 'snack', 'condiment', 'prepared', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE diet_plan_status AS ENUM ('active', 'completed', 'paused', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE meal_log_status AS ENUM ('followed', 'modified', 'skipped', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===========================================
-- CORE TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'client',
    date_of_birth DATE,
    gender TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    requested_plan subscription_type DEFAULT 'normal_gym',
    fitness_goal TEXT,
    status request_status DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS trainer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specializations TEXT[] DEFAULT '{}',
    bio TEXT,
    certifications TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    experience_years INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_clients INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fitness_goal TEXT,
    medical_conditions TEXT,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    assigned_trainer_id UUID REFERENCES profiles(id),
    assigned_dietitian_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS dietitian_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    license_number TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_clients INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Subscription tiers
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code TEXT UNIQUE NOT NULL,
    tier_name TEXT NOT NULL,
    tier_name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    includes_gym BOOLEAN DEFAULT TRUE NOT NULL,
    includes_pt BOOLEAN DEFAULT FALSE NOT NULL,
    includes_dietitian BOOLEAN DEFAULT FALSE NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    quarterly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    max_pt_sessions_per_month INTEGER DEFAULT 0,
    max_dietitian_sessions_per_month INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed subscription tiers (only if empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM subscription_tiers LIMIT 1) THEN
    INSERT INTO subscription_tiers (tier_code, tier_name, tier_name_ar, description, description_ar, includes_gym, includes_pt, includes_dietitian, monthly_price, quarterly_price, yearly_price, max_pt_sessions_per_month, max_dietitian_sessions_per_month, display_order, features)
    VALUES
      ('normal_gym', 'Normal Gym', 'عضوية الصالة', 'Basic gym access', 'دخول الصالة الرياضية', TRUE, FALSE, FALSE, 150.00, 400.00, 1500.00, 0, 0, 1, '[{"en": "Unlimited gym access", "ar": "دخول غير محدود"}]'::jsonb),
      ('with_pt', 'Personal Training', 'تدريب شخصي', 'Gym + PT sessions', 'دخول مع تدريب شخصي', TRUE, TRUE, FALSE, 350.00, 950.00, 3600.00, 8, 0, 2, '[{"en": "8 PT sessions/month", "ar": "8 جلسات شهرياً"}]'::jsonb),
      ('with_dietitian', 'Nutrition Plan', 'خطة تغذية', 'Gym + dietitian', 'دخول مع تغذية', TRUE, FALSE, TRUE, 300.00, 800.00, 3000.00, 0, 4, 3, '[{"en": "4 dietitian sessions/month", "ar": "4 جلسات تغذية"}]'::jsonb),
      ('premium', 'Premium Package', 'الباقة المميزة', 'Full experience', 'تجربة كاملة', TRUE, TRUE, TRUE, 550.00, 1500.00, 5500.00, 12, 4, 4, '[{"en": "All benefits", "ar": "كل المزايا"}]'::jsonb);
  END IF;
END $$;

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES subscription_tiers(id),
    subscription_type subscription_type NOT NULL DEFAULT 'normal_gym',
    status subscription_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id)
);

CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    specific_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    session_type TEXT DEFAULT 'pt_session',
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_attendance_day ON attendance (client_id, check_in_date);

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    muscle_group TEXT,
    equipment TEXT,
    difficulty TEXT,
    video_url TEXT,
    image_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES profiles(id),
    workout_date DATE NOT NULL,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    notes TEXT,
    exercises JSONB DEFAULT '[]',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consecutive_months INTEGER DEFAULT 0,
    total_months INTEGER DEFAULT 0,
    last_subscription_date DATE,
    current_streak_start DATE,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id)
);

-- Dietitian system
CREATE TABLE IF NOT EXISTS client_dietitian_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    UNIQUE(client_id, dietitian_id)
);

CREATE TABLE IF NOT EXISTS body_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recorded_by_id UUID REFERENCES profiles(id),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    age INTEGER,
    gender TEXT,
    total_body_water_l DECIMAL(5,2),
    protein_kg DECIMAL(5,2),
    minerals_kg DECIMAL(5,2),
    body_fat_mass_kg DECIMAL(5,2),
    skeletal_muscle_mass_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    percent_body_fat DECIMAL(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, measurement_date)
);

CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    brand TEXT,
    description TEXT,
    category food_category DEFAULT 'other' NOT NULL,
    serving_size DECIMAL(6,2) DEFAULT 100,
    serving_unit TEXT DEFAULT 'g',
    calories_per_serving DECIMAL(6,2),
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    fiber_g DECIMAL(5,2),
    sugar_g DECIMAL(5,2),
    sodium_mg DECIMAL(6,2),
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietitian_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT DEFAULT 'weekly' CHECK (plan_type IN ('weekly', 'monthly')),
    start_date DATE NOT NULL,
    end_date DATE,
    status diet_plan_status DEFAULT 'draft' NOT NULL,
    target_calories INTEGER,
    target_protein_g INTEGER,
    target_carbs_g INTEGER,
    target_fat_g INTEGER,
    cheat_days TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_type meal_type NOT NULL,
    scheduled_time TIME,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_number INTEGER DEFAULT 1,
    specific_date DATE,
    name TEXT,
    description TEXT,
    total_calories INTEGER,
    total_protein_g DECIMAL(5,2),
    total_carbs_g DECIMAL(5,2),
    total_fat_g DECIMAL(5,2),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS diet_plan_meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id),
    custom_item_name TEXT,
    custom_item_name_ar TEXT,
    quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'serving',
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    alternatives TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    diet_plan_meal_id UUID REFERENCES diet_plan_meals(id),
    meal_type meal_type NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status meal_log_status DEFAULT 'pending' NOT NULL,
    total_calories INTEGER,
    total_protein_g DECIMAL(5,2),
    total_carbs_g DECIMAL(5,2),
    total_fat_g DECIMAL(5,2),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, meal_date, meal_type)
);

CREATE TABLE IF NOT EXISTS meal_log_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id),
    custom_name TEXT,
    quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'serving',
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS trainer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    months_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2),
    free_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed loyalty rewards (only if empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM loyalty_rewards LIMIT 1) THEN
    INSERT INTO loyalty_rewards (name, description, months_required, discount_percentage, free_sessions)
    VALUES
      ('Bronze Member', '3 months consecutive - 5% discount', 3, 5.00, 0),
      ('Silver Member', '6 months consecutive - 10% discount + 1 free PT', 6, 10.00, 1),
      ('Gold Member', '12 months consecutive - 15% discount + 2 free PT', 12, 15.00, 2),
      ('Platinum Member', '24 months consecutive - 20% discount + 4 free PT', 24, 20.00, 4);
  END IF;
END $$;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        NEW.bmi = ROUND((NEW.weight_kg / ((NEW.height_cm / 100) * (NEW.height_cm / 100)))::numeric, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_trainer(user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'trainer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_dietitian(user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'dietitian');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION dietitian_has_client(dietitian_user_id UUID, client_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_dietitian_assignments 
        WHERE dietitian_id = dietitian_user_id AND client_id = client_user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trainer_has_client(trainer_user_id UUID, client_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_profiles 
        WHERE user_id = client_user_id AND assigned_trainer_id = trainer_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION client_has_pt_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id AND s.status = 'active' AND t.includes_pt = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION client_has_dietitian_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id AND s.status = 'active' AND t.includes_dietitian = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS (DROP IF EXISTS then CREATE)
-- ===========================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_trainer_profiles_updated_at ON trainer_profiles;
CREATE TRIGGER update_trainer_profiles_updated_at BEFORE UPDATE ON trainer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_dietitian_profiles_updated_at ON dietitian_profiles;
CREATE TRIGGER update_dietitian_profiles_updated_at BEFORE UPDATE ON dietitian_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_loyalty_updated_at ON loyalty_tracking;
CREATE TRIGGER update_loyalty_updated_at BEFORE UPDATE ON loyalty_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_body_compositions_updated_at ON body_compositions;
CREATE TRIGGER update_body_compositions_updated_at BEFORE UPDATE ON body_compositions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_foods_updated_at ON foods;
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_diet_plans_updated_at ON diet_plans;
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS auto_calc_bmi ON body_compositions;
CREATE TRIGGER auto_calc_bmi BEFORE INSERT OR UPDATE ON body_compositions FOR EACH ROW EXECUTE FUNCTION auto_calculate_bmi();

-- ===========================================
-- RLS
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietitian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dietitian_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop if exists then create - handled per table below)
DO $$
DECLARE
  t text;
  policies text[] := ARRAY[
    'profiles_select_own', 'profiles_select_admin', 'profiles_select_trainer', 'profiles_select_dietitian',
    'profiles_update_own', 'profiles_update_admin', 'profiles_insert', 'profiles_delete_admin'
  ];
  pol text;
BEGIN
  -- Profiles
  FOREACH pol IN ARRAY policies LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol);
  END LOOP;
  CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin(auth.uid()));
  CREATE POLICY "profiles_select_trainer" ON profiles FOR SELECT USING (is_trainer(auth.uid()));
  CREATE POLICY "profiles_select_dietitian" ON profiles FOR SELECT USING (is_dietitian(auth.uid()));
  CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin(auth.uid()));
  CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_admin(auth.uid()));

  -- Subscriptions
  DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_select_admin" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
  DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
  CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (client_id = auth.uid());
  CREATE POLICY "subscriptions_select_admin" ON subscriptions FOR SELECT USING (is_admin(auth.uid()));
  CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (is_admin(auth.uid()));

  -- Client profiles
  DROP POLICY IF EXISTS "client_profiles_select_own" ON client_profiles;
  DROP POLICY IF EXISTS "client_profiles_select_admin" ON client_profiles;
  DROP POLICY IF EXISTS "client_profiles_select_trainer" ON client_profiles;
  DROP POLICY IF EXISTS "client_profiles_select_dietitian" ON client_profiles;
  DROP POLICY IF EXISTS "client_profiles_insert" ON client_profiles;
  DROP POLICY IF EXISTS "client_profiles_update" ON client_profiles;
  CREATE POLICY "client_profiles_select_own" ON client_profiles FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "client_profiles_select_admin" ON client_profiles FOR SELECT USING (is_admin(auth.uid()));
  CREATE POLICY "client_profiles_select_trainer" ON client_profiles FOR SELECT USING (is_trainer(auth.uid()) AND assigned_trainer_id = auth.uid());
  CREATE POLICY "client_profiles_select_dietitian" ON client_profiles FOR SELECT USING (is_dietitian(auth.uid()) AND assigned_dietitian_id = auth.uid());
  CREATE POLICY "client_profiles_insert" ON client_profiles FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "client_profiles_update" ON client_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

  -- Loyalty
  DROP POLICY IF EXISTS "loyalty_select_own" ON loyalty_tracking;
  DROP POLICY IF EXISTS "loyalty_select_admin" ON loyalty_tracking;
  DROP POLICY IF EXISTS "loyalty_insert" ON loyalty_tracking;
  DROP POLICY IF EXISTS "loyalty_update" ON loyalty_tracking;
  CREATE POLICY "loyalty_select_own" ON loyalty_tracking FOR SELECT USING (client_id = auth.uid());
  CREATE POLICY "loyalty_select_admin" ON loyalty_tracking FOR SELECT USING (is_admin(auth.uid()));
  CREATE POLICY "loyalty_insert" ON loyalty_tracking FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "loyalty_update" ON loyalty_tracking FOR UPDATE USING (is_admin(auth.uid()));

  -- Foods
  DROP POLICY IF EXISTS "foods_select" ON foods;
  DROP POLICY IF EXISTS "foods_insert" ON foods;
  DROP POLICY IF EXISTS "foods_update" ON foods;
  DROP POLICY IF EXISTS "foods_delete" ON foods;
  CREATE POLICY "foods_select" ON foods FOR SELECT USING (TRUE);
  CREATE POLICY "foods_insert" ON foods FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "foods_update" ON foods FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
  CREATE POLICY "foods_delete" ON foods FOR DELETE USING (is_admin(auth.uid()));
END $$;

-- Remaining policies (batch with DROP IF EXISTS)
DROP POLICY IF EXISTS "subscription_tiers_select" ON subscription_tiers;
DROP POLICY IF EXISTS "subscription_tiers_admin" ON subscription_tiers;
CREATE POLICY "subscription_tiers_select" ON subscription_tiers FOR SELECT USING (TRUE);
CREATE POLICY "subscription_tiers_admin" ON subscription_tiers FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "registration_requests_select" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_insert" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_update" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_delete" ON registration_requests;
CREATE POLICY "registration_requests_select" ON registration_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_insert" ON registration_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "registration_requests_update" ON registration_requests FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_delete" ON registration_requests FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "trainer_profiles_select" ON trainer_profiles;
DROP POLICY IF EXISTS "trainer_profiles_insert" ON trainer_profiles;
DROP POLICY IF EXISTS "trainer_profiles_update" ON trainer_profiles;
DROP POLICY IF EXISTS "trainer_profiles_delete" ON trainer_profiles;
CREATE POLICY "trainer_profiles_select" ON trainer_profiles FOR SELECT USING (TRUE);
CREATE POLICY "trainer_profiles_insert" ON trainer_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "trainer_profiles_update" ON trainer_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "trainer_profiles_delete" ON trainer_profiles FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "dietitian_profiles_select" ON dietitian_profiles;
DROP POLICY IF EXISTS "dietitian_profiles_insert" ON dietitian_profiles;
DROP POLICY IF EXISTS "dietitian_profiles_update" ON dietitian_profiles;
CREATE POLICY "dietitian_profiles_select" ON dietitian_profiles FOR SELECT USING (TRUE);
CREATE POLICY "dietitian_profiles_insert" ON dietitian_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "dietitian_profiles_update" ON dietitian_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "availability_select" ON availability;
DROP POLICY IF EXISTS "availability_insert" ON availability;
DROP POLICY IF EXISTS "availability_update" ON availability;
DROP POLICY IF EXISTS "availability_delete" ON availability;
CREATE POLICY "availability_select" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "availability_insert" ON availability FOR INSERT WITH CHECK (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "availability_update" ON availability FOR UPDATE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "availability_delete" ON availability FOR DELETE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (client_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "bookings_select_admin" ON bookings FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (client_id = auth.uid() OR trainer_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "attendance_select_own" ON attendance;
DROP POLICY IF EXISTS "attendance_select_admin" ON attendance;
DROP POLICY IF EXISTS "attendance_select_trainer" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;
CREATE POLICY "attendance_select_own" ON attendance FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "attendance_select_admin" ON attendance FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "attendance_select_trainer" ON attendance FOR SELECT USING (is_trainer(auth.uid()));
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "exercises_select" ON exercises;
DROP POLICY IF EXISTS "exercises_insert" ON exercises;
DROP POLICY IF EXISTS "exercises_update" ON exercises;
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (TRUE);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_trainer(auth.uid()));
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (is_admin(auth.uid()) OR is_trainer(auth.uid()));

DROP POLICY IF EXISTS "workout_logs_select_own" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_select_trainer" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_select_admin" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_insert" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_update" ON workout_logs;
CREATE POLICY "workout_logs_select_own" ON workout_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "workout_logs_select_trainer" ON workout_logs FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "workout_logs_select_admin" ON workout_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "workout_logs_insert" ON workout_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "workout_logs_update" ON workout_logs FOR UPDATE USING (client_id = auth.uid() OR is_trainer(auth.uid()) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "body_compositions_select_own" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_select_admin" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_select_dietitian" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_select_trainer" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_insert" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_update" ON body_compositions;
DROP POLICY IF EXISTS "body_compositions_delete" ON body_compositions;
CREATE POLICY "body_compositions_select_own" ON body_compositions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "body_compositions_select_admin" ON body_compositions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "body_compositions_select_dietitian" ON body_compositions FOR SELECT USING (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id));
CREATE POLICY "body_compositions_select_trainer" ON body_compositions FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "body_compositions_insert" ON body_compositions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "body_compositions_update" ON body_compositions FOR UPDATE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)));
CREATE POLICY "body_compositions_delete" ON body_compositions FOR DELETE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)));

DROP POLICY IF EXISTS "assignments_select_own" ON client_dietitian_assignments;
DROP POLICY IF EXISTS "assignments_select_admin" ON client_dietitian_assignments;
DROP POLICY IF EXISTS "assignments_insert" ON client_dietitian_assignments;
DROP POLICY IF EXISTS "assignments_update" ON client_dietitian_assignments;
DROP POLICY IF EXISTS "assignments_delete" ON client_dietitian_assignments;
CREATE POLICY "assignments_select_own" ON client_dietitian_assignments FOR SELECT USING (client_id = auth.uid() OR dietitian_id = auth.uid());
CREATE POLICY "assignments_select_admin" ON client_dietitian_assignments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "assignments_insert" ON client_dietitian_assignments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "assignments_update" ON client_dietitian_assignments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "assignments_delete" ON client_dietitian_assignments FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "diet_plans_select_own" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_select_admin" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_select_dietitian" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_select_trainer" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_insert" ON diet_plans;
DROP POLICY IF EXISTS "diet_plans_update" ON diet_plans;
CREATE POLICY "diet_plans_select_own" ON diet_plans FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "diet_plans_select_admin" ON diet_plans FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "diet_plans_select_dietitian" ON diet_plans FOR SELECT USING (is_dietitian(auth.uid()) AND (dietitian_id = auth.uid() OR dietitian_has_client(auth.uid(), client_id)));
CREATE POLICY "diet_plans_select_trainer" ON diet_plans FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "diet_plans_insert" ON diet_plans FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plans_update" ON diet_plans FOR UPDATE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND (dietitian_id = auth.uid() OR dietitian_has_client(auth.uid(), client_id))));

DROP POLICY IF EXISTS "diet_plan_meals_select" ON diet_plan_meals;
DROP POLICY IF EXISTS "diet_plan_meals_insert" ON diet_plan_meals;
DROP POLICY IF EXISTS "diet_plan_meals_update" ON diet_plan_meals;
DROP POLICY IF EXISTS "diet_plan_meals_delete" ON diet_plan_meals;
CREATE POLICY "diet_plan_meals_select" ON diet_plan_meals FOR SELECT USING (TRUE);
CREATE POLICY "diet_plan_meals_insert" ON diet_plan_meals FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plan_meals_update" ON diet_plan_meals FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
CREATE POLICY "diet_plan_meals_delete" ON diet_plan_meals FOR DELETE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

DROP POLICY IF EXISTS "diet_plan_meal_items_select" ON diet_plan_meal_items;
DROP POLICY IF EXISTS "diet_plan_meal_items_insert" ON diet_plan_meal_items;
DROP POLICY IF EXISTS "diet_plan_meal_items_update" ON diet_plan_meal_items;
DROP POLICY IF EXISTS "diet_plan_meal_items_delete" ON diet_plan_meal_items;
CREATE POLICY "diet_plan_meal_items_select" ON diet_plan_meal_items FOR SELECT USING (TRUE);
CREATE POLICY "diet_plan_meal_items_insert" ON diet_plan_meal_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plan_meal_items_update" ON diet_plan_meal_items FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
CREATE POLICY "diet_plan_meal_items_delete" ON diet_plan_meal_items FOR DELETE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

DROP POLICY IF EXISTS "meal_logs_select_own" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_select_admin" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_select_dietitian" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_insert" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_update" ON meal_logs;
CREATE POLICY "meal_logs_select_own" ON meal_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "meal_logs_select_admin" ON meal_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "meal_logs_select_dietitian" ON meal_logs FOR SELECT USING (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id));
CREATE POLICY "meal_logs_insert" ON meal_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_logs_update" ON meal_logs FOR UPDATE USING (client_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "meal_log_items_select" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_insert" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_update" ON meal_log_items;
DROP POLICY IF EXISTS "meal_log_items_delete" ON meal_log_items;
CREATE POLICY "meal_log_items_select" ON meal_log_items FOR SELECT USING (TRUE);
CREATE POLICY "meal_log_items_insert" ON meal_log_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_log_items_update" ON meal_log_items FOR UPDATE USING (TRUE);
CREATE POLICY "meal_log_items_delete" ON meal_log_items FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "gym_settings_select" ON gym_settings;
DROP POLICY IF EXISTS "gym_settings_update" ON gym_settings;
DROP POLICY IF EXISTS "gym_settings_insert" ON gym_settings;
CREATE POLICY "gym_settings_select" ON gym_settings FOR SELECT USING (TRUE);
CREATE POLICY "gym_settings_update" ON gym_settings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "gym_settings_insert" ON gym_settings FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid() OR (recipient_type = 'admin' AND is_admin(auth.uid())));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (recipient_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_select_admin" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "payments_select_admin" ON payments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "trainer_requests_select_own" ON trainer_requests;
DROP POLICY IF EXISTS "trainer_requests_select_admin" ON trainer_requests;
DROP POLICY IF EXISTS "trainer_requests_insert" ON trainer_requests;
DROP POLICY IF EXISTS "trainer_requests_update" ON trainer_requests;
CREATE POLICY "trainer_requests_select_own" ON trainer_requests FOR SELECT USING (client_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "trainer_requests_select_admin" ON trainer_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "trainer_requests_insert" ON trainer_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "trainer_requests_update" ON trainer_requests FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "loyalty_rewards_select" ON loyalty_rewards;
DROP POLICY IF EXISTS "loyalty_rewards_admin" ON loyalty_rewards;
CREATE POLICY "loyalty_rewards_select" ON loyalty_rewards FOR SELECT USING (TRUE);
CREATE POLICY "loyalty_rewards_admin" ON loyalty_rewards FOR ALL USING (is_admin(auth.uid()));

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trainer ON bookings(trainer_id);
-- booking_date may have been renamed to scheduled_date (schema_fixes migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_date') THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'scheduled_date') THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(scheduled_date);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_attendance_client ON attendance(client_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(check_in_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_client ON workout_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_body_compositions_client ON body_compositions(client_id);
CREATE INDEX IF NOT EXISTS idx_body_compositions_date ON body_compositions(measurement_date);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_status ON diet_plans(status);
CREATE INDEX IF NOT EXISTS idx_meal_logs_client ON meal_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(meal_date);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_client_dietitian_assignments_active ON client_dietitian_assignments(dietitian_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
