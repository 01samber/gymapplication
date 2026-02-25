-- ================================================================
-- SWEATBOX GYM - COMPLETE FRESH DATABASE SETUP
-- ================================================================
-- Run this ONE file to set up everything from scratch
-- ================================================================

-- ===========================================
-- STEP 1: CLEAN UP EVERYTHING
-- ===========================================

-- Drop all policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Drop all tables
DROP TABLE IF EXISTS meal_log_items CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS diet_plan_meal_items CASCADE;
DROP TABLE IF EXISTS diet_plan_meals CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;
DROP TABLE IF EXISTS foods CASCADE;
DROP TABLE IF EXISTS body_compositions CASCADE;
DROP TABLE IF EXISTS client_dietitian_assignments CASCADE;
DROP TABLE IF EXISTS dietitian_profiles CASCADE;
DROP TABLE IF EXISTS loyalty_tracking CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS trainer_profiles CASCADE;
DROP TABLE IF EXISTS registration_requests CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS gym_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS trainer_requests CASCADE;
DROP TABLE IF EXISTS loyalty_rewards CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS auto_calculate_bmi() CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_trainer(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_dietitian(UUID) CASCADE;
DROP FUNCTION IF EXISTS dietitian_has_client(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS trainer_has_client(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_bmi(DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_meal_log() CASCADE;

-- Drop all types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS food_category CASCADE;
DROP TYPE IF EXISTS meal_type CASCADE;
DROP TYPE IF EXISTS diet_plan_status CASCADE;
DROP TYPE IF EXISTS meal_log_status CASCADE;

-- ===========================================
-- STEP 2: CREATE ENUMS
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'client', 'dietitian');
CREATE TYPE subscription_type AS ENUM ('open_gym', 'with_pt');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE food_category AS ENUM ('dairy', 'protein', 'grains', 'vegetable', 'fruit', 'fats', 'nuts', 'legumes', 'beverage', 'snack', 'condiment', 'prepared', 'other');
CREATE TYPE meal_type AS ENUM ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack');
CREATE TYPE diet_plan_status AS ENUM ('active', 'completed', 'paused', 'draft');
CREATE TYPE meal_log_status AS ENUM ('followed', 'modified', 'skipped', 'pending');

-- ===========================================
-- STEP 3: CREATE CORE TABLES
-- ===========================================

-- Profiles (all users)
CREATE TABLE profiles (
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

-- Registration Requests
CREATE TABLE registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    requested_plan subscription_type DEFAULT 'open_gym',
    fitness_goal TEXT,
    status request_status DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trainer Profiles
CREATE TABLE trainer_profiles (
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

-- Client Profiles
CREATE TABLE client_profiles (
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

-- Dietitian Profiles
CREATE TABLE dietitian_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specialization TEXT,
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    license_number TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    years_experience INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    max_clients INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type subscription_type NOT NULL,
    status subscription_status DEFAULT 'pending' NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pt_sessions_included INTEGER DEFAULT 0,
    pt_sessions_used INTEGER DEFAULT 0,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Availability
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status DEFAULT 'pending' NOT NULL,
    session_type TEXT DEFAULT 'PT Session',
    notes TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Attendance (with separate date column for unique index)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT NOT NULL,
    equipment TEXT,
    difficulty TEXT DEFAULT 'intermediate',
    instructions TEXT[],
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workout Logs
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES profiles(id),
    booking_id UUID REFERENCES bookings(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    notes TEXT,
    exercises JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Loyalty Tracking
CREATE TABLE loyalty_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consecutive_months INTEGER DEFAULT 0,
    total_months INTEGER DEFAULT 0,
    last_subscription_date DATE,
    discount_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id)
);

-- ===========================================
-- STEP 4: CREATE DIETITIAN TABLES
-- ===========================================

-- Body Compositions
CREATE TABLE body_compositions (
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
    left_arm_lean_kg DECIMAL(5,2),
    left_arm_lean_percent DECIMAL(5,2),
    right_arm_lean_kg DECIMAL(5,2),
    right_arm_lean_percent DECIMAL(5,2),
    trunk_lean_kg DECIMAL(5,2),
    trunk_lean_percent DECIMAL(5,2),
    left_leg_lean_kg DECIMAL(5,2),
    left_leg_lean_percent DECIMAL(5,2),
    right_leg_lean_kg DECIMAL(5,2),
    right_leg_lean_percent DECIMAL(5,2),
    left_arm_fat_kg DECIMAL(5,2),
    left_arm_fat_percent DECIMAL(5,2),
    right_arm_fat_kg DECIMAL(5,2),
    right_arm_fat_percent DECIMAL(5,2),
    trunk_fat_kg DECIMAL(5,2),
    trunk_fat_percent DECIMAL(5,2),
    left_leg_fat_kg DECIMAL(5,2),
    left_leg_fat_percent DECIMAL(5,2),
    right_leg_fat_kg DECIMAL(5,2),
    right_leg_fat_percent DECIMAL(5,2),
    fat_free_mass_kg DECIMAL(5,2),
    basal_metabolic_rate INTEGER,
    waist_hip_ratio DECIMAL(4,2),
    visceral_fat_level INTEGER,
    metabolic_age INTEGER,
    target_weight_kg DECIMAL(5,2),
    weight_control_kg DECIMAL(5,2),
    fat_control_kg DECIMAL(5,2),
    muscle_control_kg DECIMAL(5,2),
    impedance_data JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Foods
CREATE TABLE foods (
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

-- Diet Plans
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietitian_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status diet_plan_status DEFAULT 'draft' NOT NULL,
    target_calories INTEGER,
    target_protein_g INTEGER,
    target_carbs_g INTEGER,
    target_fat_g INTEGER,
    target_fiber_g INTEGER,
    target_water_l DECIMAL(3,1),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Diet Plan Meals
CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_type meal_type NOT NULL,
    scheduled_time TIME,
    day_of_week INTEGER,
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

-- Diet Plan Meal Items
CREATE TABLE diet_plan_meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES diet_plan_meals(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id),
    custom_item_name TEXT,
    custom_item_name_ar TEXT,
    quantity DECIMAL(6,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'g',
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    alternatives TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meal Logs
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    diet_plan_meal_id UUID REFERENCES diet_plan_meals(id),
    meal_type meal_type NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    meal_date DATE DEFAULT CURRENT_DATE NOT NULL,
    status meal_log_status DEFAULT 'pending' NOT NULL,
    total_calories INTEGER,
    total_protein_g DECIMAL(5,2),
    total_carbs_g DECIMAL(5,2),
    total_fat_g DECIMAL(5,2),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meal Log Items
CREATE TABLE meal_log_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id),
    custom_name TEXT,
    quantity DECIMAL(6,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'g',
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Client-Dietitian Assignments
CREATE TABLE client_dietitian_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    assigned_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, dietitian_id)
);

-- ===========================================
-- STEP 5: CREATE ADDITIONAL TABLES
-- ===========================================

-- Gym Settings
CREATE TABLE gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_name TEXT DEFAULT 'SweatBox Gym',
    address TEXT DEFAULT 'Sarba, Jounieh, Lebanon',
    phone TEXT,
    email TEXT,
    website TEXT,
    open_gym_price_usd DECIMAL(10,2) DEFAULT 75.00,
    pt_package_price_usd DECIMAL(10,2) DEFAULT 200.00,
    pt_sessions_per_package INTEGER DEFAULT 8,
    operating_hours JSONB DEFAULT '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "20:00"}, "sunday": {"open": "08:00", "close": "18:00"}}',
    loyalty_enabled BOOLEAN DEFAULT TRUE,
    auto_renewal_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default settings
INSERT INTO gym_settings (id) VALUES (gen_random_uuid());

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount_usd DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    reference_number TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trainer Requests
CREATE TABLE trainer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    target_trainer_id UUID REFERENCES profiles(id),
    reason TEXT,
    status request_status DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Loyalty Rewards
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    months_milestone INTEGER NOT NULL,
    claimed_at TIMESTAMPTZ,
    expires_at DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- STEP 6: CREATE INDEXES
-- ===========================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_registration_requests_email ON registration_requests(email);
CREATE INDEX idx_registration_requests_status ON registration_requests(status);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_trainer ON bookings(trainer_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_attendance_client ON attendance(client_id);
CREATE INDEX idx_attendance_date ON attendance(check_in);
CREATE INDEX idx_body_compositions_client ON body_compositions(client_id);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX idx_diet_plans_dietitian ON diet_plans(dietitian_id);
CREATE INDEX idx_meal_logs_client ON meal_logs(client_id);
CREATE INDEX idx_meal_logs_date ON meal_logs(meal_date);
CREATE INDEX idx_client_dietitian_client ON client_dietitian_assignments(client_id);
CREATE INDEX idx_client_dietitian_dietitian ON client_dietitian_assignments(dietitian_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(recipient_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_trainer_requests_trainer ON trainer_requests(trainer_id);
CREATE INDEX idx_trainer_requests_status ON trainer_requests(status);
CREATE INDEX idx_loyalty_rewards_client ON loyalty_rewards(client_id);
CREATE INDEX idx_loyalty_rewards_status ON loyalty_rewards(status);

-- ===========================================
-- STEP 7: CREATE UNIQUE INDEXES FOR DUPLICATE PREVENTION
-- ===========================================

-- Prevent duplicate active subscriptions for same client
CREATE UNIQUE INDEX idx_unique_active_subscription 
ON subscriptions (client_id) 
WHERE status = 'active';

-- Prevent duplicate active diet plans for same client
CREATE UNIQUE INDEX idx_unique_active_diet_plan 
ON diet_plans (client_id) 
WHERE status = 'active';

-- Prevent duplicate client-dietitian assignments (only one active per client)
CREATE UNIQUE INDEX idx_unique_active_client_dietitian 
ON client_dietitian_assignments (client_id) 
WHERE is_active = TRUE;

-- Prevent duplicate meal logs for same client/meal_type/date
CREATE UNIQUE INDEX idx_unique_meal_log 
ON meal_logs (client_id, meal_type, meal_date);

-- Prevent duplicate body compositions for same client/date
CREATE UNIQUE INDEX idx_unique_body_composition_date 
ON body_compositions (client_id, measurement_date);

-- Prevent duplicate bookings (same client, trainer, date, time)
CREATE UNIQUE INDEX idx_unique_booking 
ON bookings (client_id, trainer_id, date, start_time) 
WHERE status NOT IN ('cancelled');

-- Prevent duplicate attendance check-ins for same day (using check_in_date column)
CREATE UNIQUE INDEX idx_unique_attendance_day 
ON attendance (client_id, check_in_date);

-- ===========================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ===========================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_trainer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'trainer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_dietitian(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'dietitian');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION dietitian_has_client(p_dietitian_id UUID, p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_dietitian_assignments
        WHERE dietitian_id = p_dietitian_id AND client_id = p_client_id AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION trainer_has_client(p_trainer_id UUID, p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_profiles WHERE user_id = p_client_id AND assigned_trainer_id = p_trainer_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION calculate_bmi(weight_kg DECIMAL, height_cm DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height_cm IS NULL OR height_cm = 0 OR weight_kg IS NULL THEN RETURN NULL; END IF;
    RETURN ROUND((weight_kg / ((height_cm / 100) * (height_cm / 100)))::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION auto_calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    NEW.bmi := calculate_bmi(NEW.weight_kg, NEW.height_cm);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_bmi
    BEFORE INSERT OR UPDATE ON body_compositions
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_bmi();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 9: ENABLE RLS ON ALL TABLES
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietitian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dietitian_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 10: CREATE RLS POLICIES
-- ===========================================

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "profiles_select_trainer" ON profiles FOR SELECT USING (is_trainer(auth.uid()));
CREATE POLICY "profiles_select_dietitian" ON profiles FOR SELECT USING (is_dietitian(auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin(auth.uid()));

-- REGISTRATION REQUESTS
CREATE POLICY "registration_requests_insert" ON registration_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "registration_requests_select_admin" ON registration_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_update_admin" ON registration_requests FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_delete_admin" ON registration_requests FOR DELETE USING (is_admin(auth.uid()));

-- TRAINER PROFILES
CREATE POLICY "trainer_profiles_select" ON trainer_profiles FOR SELECT USING (TRUE);
CREATE POLICY "trainer_profiles_insert" ON trainer_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "trainer_profiles_update" ON trainer_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- CLIENT PROFILES
CREATE POLICY "client_profiles_select_own" ON client_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "client_profiles_select_admin" ON client_profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "client_profiles_select_trainer" ON client_profiles FOR SELECT USING (is_trainer(auth.uid()));
CREATE POLICY "client_profiles_select_dietitian" ON client_profiles FOR SELECT USING (is_dietitian(auth.uid()));
CREATE POLICY "client_profiles_insert" ON client_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "client_profiles_update" ON client_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- DIETITIAN PROFILES
CREATE POLICY "dietitian_profiles_select" ON dietitian_profiles FOR SELECT USING (TRUE);
CREATE POLICY "dietitian_profiles_insert" ON dietitian_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "dietitian_profiles_update" ON dietitian_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "subscriptions_select_admin" ON subscriptions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (is_admin(auth.uid()));

-- AVAILABILITY
CREATE POLICY "availability_select" ON availability FOR SELECT USING (TRUE);
CREATE POLICY "availability_insert" ON availability FOR INSERT WITH CHECK (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "availability_update" ON availability FOR UPDATE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "availability_delete" ON availability FOR DELETE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));

-- BOOKINGS
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (client_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "bookings_select_admin" ON bookings FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (client_id = auth.uid() OR trainer_id = auth.uid() OR is_admin(auth.uid()));

-- ATTENDANCE
CREATE POLICY "attendance_select_own" ON attendance FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "attendance_select_admin" ON attendance FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (TRUE);

-- EXERCISES
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (TRUE);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "exercises_delete" ON exercises FOR DELETE USING (is_admin(auth.uid()));

-- WORKOUT LOGS
CREATE POLICY "workout_logs_select_own" ON workout_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "workout_logs_select_trainer" ON workout_logs FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "workout_logs_select_admin" ON workout_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "workout_logs_insert" ON workout_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "workout_logs_update" ON workout_logs FOR UPDATE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));

-- LOYALTY TRACKING
CREATE POLICY "loyalty_select_own" ON loyalty_tracking FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "loyalty_select_admin" ON loyalty_tracking FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "loyalty_insert" ON loyalty_tracking FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "loyalty_update" ON loyalty_tracking FOR UPDATE USING (is_admin(auth.uid()));

-- BODY COMPOSITIONS
CREATE POLICY "body_compositions_select_own" ON body_compositions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "body_compositions_select_admin" ON body_compositions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "body_compositions_select_dietitian" ON body_compositions FOR SELECT USING (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id));
CREATE POLICY "body_compositions_select_trainer" ON body_compositions FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "body_compositions_insert" ON body_compositions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "body_compositions_update" ON body_compositions FOR UPDATE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)));
CREATE POLICY "body_compositions_delete" ON body_compositions FOR DELETE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id)));

-- FOODS
CREATE POLICY "foods_select" ON foods FOR SELECT USING (TRUE);
CREATE POLICY "foods_insert" ON foods FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "foods_update" ON foods FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
CREATE POLICY "foods_delete" ON foods FOR DELETE USING (is_admin(auth.uid()));

-- DIET PLANS
CREATE POLICY "diet_plans_select_own" ON diet_plans FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "diet_plans_select_admin" ON diet_plans FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "diet_plans_select_dietitian" ON diet_plans FOR SELECT USING (is_dietitian(auth.uid()) AND (dietitian_id = auth.uid() OR dietitian_has_client(auth.uid(), client_id)));
CREATE POLICY "diet_plans_select_trainer" ON diet_plans FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "diet_plans_insert" ON diet_plans FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plans_update" ON diet_plans FOR UPDATE USING (is_admin(auth.uid()) OR (is_dietitian(auth.uid()) AND (dietitian_id = auth.uid() OR dietitian_has_client(auth.uid(), client_id))));

-- DIET PLAN MEALS
CREATE POLICY "diet_plan_meals_select" ON diet_plan_meals FOR SELECT USING (TRUE);
CREATE POLICY "diet_plan_meals_insert" ON diet_plan_meals FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plan_meals_update" ON diet_plan_meals FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
CREATE POLICY "diet_plan_meals_delete" ON diet_plan_meals FOR DELETE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- DIET PLAN MEAL ITEMS
CREATE POLICY "diet_plan_meal_items_select" ON diet_plan_meal_items FOR SELECT USING (TRUE);
CREATE POLICY "diet_plan_meal_items_insert" ON diet_plan_meal_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "diet_plan_meal_items_update" ON diet_plan_meal_items FOR UPDATE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));
CREATE POLICY "diet_plan_meal_items_delete" ON diet_plan_meal_items FOR DELETE USING (is_admin(auth.uid()) OR is_dietitian(auth.uid()));

-- MEAL LOGS
CREATE POLICY "meal_logs_select_own" ON meal_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "meal_logs_select_admin" ON meal_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "meal_logs_select_dietitian" ON meal_logs FOR SELECT USING (is_dietitian(auth.uid()) AND dietitian_has_client(auth.uid(), client_id));
CREATE POLICY "meal_logs_select_trainer" ON meal_logs FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "meal_logs_insert" ON meal_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_logs_update" ON meal_logs FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "meal_logs_delete" ON meal_logs FOR DELETE USING (client_id = auth.uid());

-- MEAL LOG ITEMS
CREATE POLICY "meal_log_items_select" ON meal_log_items FOR SELECT USING (TRUE);
CREATE POLICY "meal_log_items_insert" ON meal_log_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_log_items_update" ON meal_log_items FOR UPDATE USING (EXISTS (SELECT 1 FROM meal_logs WHERE meal_logs.id = meal_log_items.log_id AND meal_logs.client_id = auth.uid()));
CREATE POLICY "meal_log_items_delete" ON meal_log_items FOR DELETE USING (EXISTS (SELECT 1 FROM meal_logs WHERE meal_logs.id = meal_log_items.log_id AND meal_logs.client_id = auth.uid()));

-- CLIENT-DIETITIAN ASSIGNMENTS
CREATE POLICY "assignments_select_client" ON client_dietitian_assignments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "assignments_select_dietitian" ON client_dietitian_assignments FOR SELECT USING (dietitian_id = auth.uid());
CREATE POLICY "assignments_select_admin" ON client_dietitian_assignments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "assignments_insert" ON client_dietitian_assignments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "assignments_update" ON client_dietitian_assignments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "assignments_delete" ON client_dietitian_assignments FOR DELETE USING (is_admin(auth.uid()));

-- GYM SETTINGS
CREATE POLICY "gym_settings_select_all" ON gym_settings FOR SELECT USING (TRUE);
CREATE POLICY "gym_settings_update_admin" ON gym_settings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "gym_settings_insert_admin" ON gym_settings FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid() OR recipient_type = (SELECT role::text FROM profiles WHERE id = auth.uid()));
CREATE POLICY "notifications_select_admin" ON notifications FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (recipient_id = auth.uid() OR is_admin(auth.uid()));

-- PAYMENTS
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "payments_select_admin" ON payments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "payments_insert_admin" ON payments FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE USING (is_admin(auth.uid()));

-- TRAINER REQUESTS
CREATE POLICY "trainer_requests_select_trainer" ON trainer_requests FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "trainer_requests_select_admin" ON trainer_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "trainer_requests_insert_trainer" ON trainer_requests FOR INSERT WITH CHECK (trainer_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "trainer_requests_update_admin" ON trainer_requests FOR UPDATE USING (is_admin(auth.uid()));

-- LOYALTY REWARDS
CREATE POLICY "loyalty_rewards_select_own" ON loyalty_rewards FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "loyalty_rewards_select_admin" ON loyalty_rewards FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "loyalty_rewards_insert_admin" ON loyalty_rewards FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "loyalty_rewards_update_admin" ON loyalty_rewards FOR UPDATE USING (is_admin(auth.uid()));

-- ===========================================
-- DONE!
-- ===========================================

SELECT 'DATABASE SETUP COMPLETE!' as status;
