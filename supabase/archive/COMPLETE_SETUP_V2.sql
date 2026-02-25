-- ================================================================
-- SWEATBOX GYM - COMPLETE DATABASE SETUP V2
-- ================================================================
-- This includes:
-- 1. Complete database schema
-- 2. 4-Tier Subscription System (Normal Gym, PT, Dietitian, Premium)
-- 3. Client-Dietitian assignments
-- 4. All RLS policies
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
DROP TABLE IF EXISTS subscription_tiers CASCADE;
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
DROP FUNCTION IF EXISTS client_has_pt_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS client_has_dietitian_access(UUID) CASCADE;

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
-- Updated subscription types for 4-tier system
CREATE TYPE subscription_type AS ENUM ('normal_gym', 'with_pt', 'with_dietitian', 'premium');
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
    requested_plan subscription_type DEFAULT 'normal_gym',
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

-- ===========================================
-- SUBSCRIPTION TIERS (4-TIER SYSTEM)
-- ===========================================

CREATE TABLE subscription_tiers (
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

-- Insert the 4 subscription tiers
INSERT INTO subscription_tiers (tier_code, tier_name, tier_name_ar, description, description_ar, includes_gym, includes_pt, includes_dietitian, monthly_price, quarterly_price, yearly_price, max_pt_sessions_per_month, max_dietitian_sessions_per_month, display_order, features)
VALUES 
    (
        'normal_gym',
        'Normal Gym',
        'عضوية الصالة',
        'Basic gym access with full equipment usage',
        'دخول الصالة الرياضية مع استخدام كامل المعدات',
        TRUE, FALSE, FALSE,
        150.00, 400.00, 1500.00,
        0, 0, 1,
        '[{"en": "Unlimited gym access", "ar": "دخول غير محدود للصالة"}, {"en": "All equipment usage", "ar": "استخدام جميع المعدات"}, {"en": "Locker room access", "ar": "استخدام غرف تبديل الملابس"}, {"en": "Free WiFi", "ar": "واي فاي مجاني"}]'::jsonb
    ),
    (
        'with_pt',
        'Personal Training',
        'تدريب شخصي',
        'Gym access with dedicated personal trainer sessions',
        'دخول الصالة مع جلسات مدرب شخصي',
        TRUE, TRUE, FALSE,
        350.00, 950.00, 3600.00,
        8, 0, 2,
        '[{"en": "Everything in Normal Gym", "ar": "كل ما في عضوية الصالة"}, {"en": "8 PT sessions per month", "ar": "8 جلسات تدريب شخصي شهرياً"}, {"en": "Personalized workout plan", "ar": "خطة تمارين مخصصة"}, {"en": "Progress tracking", "ar": "متابعة التقدم"}]'::jsonb
    ),
    (
        'with_dietitian',
        'Nutrition Plan',
        'خطة تغذية',
        'Gym access with professional dietitian consultation',
        'دخول الصالة مع استشارات أخصائي تغذية',
        TRUE, FALSE, TRUE,
        300.00, 800.00, 3000.00,
        0, 4, 3,
        '[{"en": "Everything in Normal Gym", "ar": "كل ما في عضوية الصالة"}, {"en": "4 dietitian sessions per month", "ar": "4 جلسات تغذية شهرياً"}, {"en": "Custom diet plan", "ar": "خطة غذائية مخصصة"}, {"en": "Body composition analysis", "ar": "تحليل تركيب الجسم"}]'::jsonb
    ),
    (
        'premium',
        'Premium Package',
        'الباقة المميزة',
        'Complete fitness experience with PT and nutrition',
        'تجربة لياقة كاملة مع التدريب والتغذية',
        TRUE, TRUE, TRUE,
        550.00, 1500.00, 5500.00,
        12, 4, 4,
        '[{"en": "Everything in all plans", "ar": "كل ما في جميع الباقات"}, {"en": "12 PT sessions per month", "ar": "12 جلسة تدريب شخصي شهرياً"}, {"en": "4 dietitian sessions per month", "ar": "4 جلسات تغذية شهرياً"}, {"en": "Priority booking", "ar": "أولوية في الحجز"}, {"en": "VIP locker", "ar": "خزانة VIP"}]'::jsonb
    );

-- Subscriptions
CREATE TABLE subscriptions (
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

-- Trainer Availability
CREATE TABLE availability (
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

-- Bookings
CREATE TABLE bookings (
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

-- Attendance (with check_in_date for unique index)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    check_in_date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create unique index on attendance
CREATE UNIQUE INDEX idx_unique_attendance_day ON attendance (client_id, check_in_date);

-- Exercises
CREATE TABLE exercises (
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

-- Workout Logs
CREATE TABLE workout_logs (
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

-- Loyalty Tracking
CREATE TABLE loyalty_tracking (
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

-- ===========================================
-- DIETITIAN SYSTEM TABLES
-- ===========================================

-- Client-Dietitian Assignments
CREATE TABLE client_dietitian_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    UNIQUE(client_id, dietitian_id)
);

-- Body Compositions (InBody-style)
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
    left_arm_lean_kg DECIMAL(4,2),
    left_arm_lean_percent DECIMAL(4,2),
    right_arm_lean_kg DECIMAL(4,2),
    right_arm_lean_percent DECIMAL(4,2),
    trunk_lean_kg DECIMAL(5,2),
    trunk_lean_percent DECIMAL(4,2),
    left_leg_lean_kg DECIMAL(4,2),
    left_leg_lean_percent DECIMAL(4,2),
    right_leg_lean_kg DECIMAL(4,2),
    right_leg_lean_percent DECIMAL(4,2),
    left_arm_fat_kg DECIMAL(4,2),
    left_arm_fat_percent DECIMAL(4,2),
    right_arm_fat_kg DECIMAL(4,2),
    right_arm_fat_percent DECIMAL(4,2),
    trunk_fat_kg DECIMAL(5,2),
    trunk_fat_percent DECIMAL(4,2),
    left_leg_fat_kg DECIMAL(4,2),
    left_leg_fat_percent DECIMAL(4,2),
    right_leg_fat_kg DECIMAL(4,2),
    right_leg_fat_percent DECIMAL(4,2),
    fat_free_mass_kg DECIMAL(5,2),
    basal_metabolic_rate INTEGER,
    waist_hip_ratio DECIMAL(4,3),
    visceral_fat_level INTEGER,
    metabolic_age INTEGER,
    target_weight_kg DECIMAL(5,2),
    weight_control_kg DECIMAL(5,2),
    fat_control_kg DECIMAL(5,2),
    muscle_control_kg DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, measurement_date)
);

-- Foods Database
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
    plan_type TEXT DEFAULT 'weekly' CHECK (plan_type IN ('weekly', 'monthly')),
    start_date DATE NOT NULL,
    end_date DATE,
    status diet_plan_status DEFAULT 'draft' NOT NULL,
    target_calories INTEGER,
    target_protein_g INTEGER,
    target_carbs_g INTEGER,
    target_fat_g INTEGER,
    target_fiber_g INTEGER,
    target_water_l DECIMAL(3,1),
    cheat_days TEXT[], -- Array of date strings (YYYY-MM-DD) for cheat days
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
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_number INTEGER DEFAULT 1, -- Day 1, 2, 3... for the plan
    specific_date DATE, -- Specific date if assigned
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

-- Meal Commitments (for clients to track completion)
CREATE TABLE meal_commitments (
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

-- Daily Plan Tracking
CREATE TABLE daily_plan_tracking (
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

-- Diet Plan Meal Items
CREATE TABLE diet_plan_meal_items (
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

-- Meal Logs
CREATE TABLE meal_logs (
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

-- Meal Log Items
CREATE TABLE meal_log_items (
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

-- ===========================================
-- ADDITIONAL TABLES
-- ===========================================

-- Gym Settings
CREATE TABLE gym_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notifications
CREATE TABLE notifications (
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

-- Payments
CREATE TABLE payments (
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

-- Trainer Requests
CREATE TABLE trainer_requests (
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

-- Loyalty Rewards
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    months_required INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2),
    free_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default loyalty rewards
INSERT INTO loyalty_rewards (name, description, months_required, discount_percentage, free_sessions) VALUES
    ('Bronze Member', '3 months consecutive - 5% discount', 3, 5.00, 0),
    ('Silver Member', '6 months consecutive - 10% discount + 1 free PT', 6, 10.00, 1),
    ('Gold Member', '12 months consecutive - 15% discount + 2 free PT', 12, 15.00, 2),
    ('Platinum Member', '24 months consecutive - 20% discount + 4 free PT', 24, 20.00, 4);

-- ===========================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ===========================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate BMI function
CREATE OR REPLACE FUNCTION auto_calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        NEW.bmi = ROUND((NEW.weight_kg / ((NEW.height_cm / 100) * (NEW.height_cm / 100)))::numeric, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Role check functions
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

-- Check if dietitian has client assigned
CREATE OR REPLACE FUNCTION dietitian_has_client(dietitian_user_id UUID, client_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_dietitian_assignments 
        WHERE dietitian_id = dietitian_user_id 
        AND client_id = client_user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trainer has client assigned
CREATE OR REPLACE FUNCTION trainer_has_client(trainer_user_id UUID, client_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_profiles 
        WHERE user_id = client_user_id 
        AND assigned_trainer_id = trainer_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if client has PT access
CREATE OR REPLACE FUNCTION client_has_pt_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id 
        AND s.status = 'active'
        AND t.includes_pt = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if client has dietitian access
CREATE OR REPLACE FUNCTION client_has_dietitian_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id 
        AND s.status = 'active'
        AND t.includes_dietitian = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- STEP 5: CREATE TRIGGERS
-- ===========================================

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainer_profiles_updated_at BEFORE UPDATE ON trainer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dietitian_profiles_updated_at BEFORE UPDATE ON dietitian_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_updated_at BEFORE UPDATE ON loyalty_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_body_compositions_updated_at BEFORE UPDATE ON body_compositions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BMI auto-calculation trigger
CREATE TRIGGER auto_calc_bmi BEFORE INSERT OR UPDATE ON body_compositions FOR EACH ROW EXECUTE FUNCTION auto_calculate_bmi();

-- ===========================================
-- STEP 6: ENABLE RLS
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

-- ===========================================
-- STEP 7: CREATE RLS POLICIES
-- ===========================================

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "profiles_select_trainer" ON profiles FOR SELECT USING (is_trainer(auth.uid()));
CREATE POLICY "profiles_select_dietitian" ON profiles FOR SELECT USING (is_dietitian(auth.uid()));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_admin(auth.uid()));

-- REGISTRATION REQUESTS
CREATE POLICY "registration_requests_select" ON registration_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_insert" ON registration_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "registration_requests_update" ON registration_requests FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "registration_requests_delete" ON registration_requests FOR DELETE USING (is_admin(auth.uid()));

-- TRAINER PROFILES
CREATE POLICY "trainer_profiles_select" ON trainer_profiles FOR SELECT USING (TRUE);
CREATE POLICY "trainer_profiles_insert" ON trainer_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "trainer_profiles_update" ON trainer_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "trainer_profiles_delete" ON trainer_profiles FOR DELETE USING (is_admin(auth.uid()));

-- CLIENT PROFILES
CREATE POLICY "client_profiles_select_own" ON client_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "client_profiles_select_admin" ON client_profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "client_profiles_select_trainer" ON client_profiles FOR SELECT USING (is_trainer(auth.uid()) AND assigned_trainer_id = auth.uid());
CREATE POLICY "client_profiles_select_dietitian" ON client_profiles FOR SELECT USING (is_dietitian(auth.uid()) AND assigned_dietitian_id = auth.uid());
CREATE POLICY "client_profiles_insert" ON client_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "client_profiles_update" ON client_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- DIETITIAN PROFILES
CREATE POLICY "dietitian_profiles_select" ON dietitian_profiles FOR SELECT USING (TRUE);
CREATE POLICY "dietitian_profiles_insert" ON dietitian_profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "dietitian_profiles_update" ON dietitian_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- SUBSCRIPTION TIERS
CREATE POLICY "subscription_tiers_select" ON subscription_tiers FOR SELECT USING (TRUE);
CREATE POLICY "subscription_tiers_admin" ON subscription_tiers FOR ALL USING (is_admin(auth.uid()));

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
CREATE POLICY "attendance_select_trainer" ON attendance FOR SELECT USING (is_trainer(auth.uid()));
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (is_admin(auth.uid()));

-- EXERCISES
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (TRUE);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_trainer(auth.uid()));
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (is_admin(auth.uid()) OR is_trainer(auth.uid()));

-- WORKOUT LOGS
CREATE POLICY "workout_logs_select_own" ON workout_logs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "workout_logs_select_trainer" ON workout_logs FOR SELECT USING (is_trainer(auth.uid()) AND trainer_has_client(auth.uid(), client_id));
CREATE POLICY "workout_logs_select_admin" ON workout_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "workout_logs_insert" ON workout_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "workout_logs_update" ON workout_logs FOR UPDATE USING (client_id = auth.uid() OR is_trainer(auth.uid()) OR is_admin(auth.uid()));

-- LOYALTY
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
CREATE POLICY "meal_logs_insert" ON meal_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_logs_update" ON meal_logs FOR UPDATE USING (client_id = auth.uid() OR is_admin(auth.uid()));

-- MEAL LOG ITEMS
CREATE POLICY "meal_log_items_select" ON meal_log_items FOR SELECT USING (TRUE);
CREATE POLICY "meal_log_items_insert" ON meal_log_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "meal_log_items_update" ON meal_log_items FOR UPDATE USING (TRUE);
CREATE POLICY "meal_log_items_delete" ON meal_log_items FOR DELETE USING (TRUE);

-- CLIENT DIETITIAN ASSIGNMENTS
CREATE POLICY "assignments_select_own" ON client_dietitian_assignments FOR SELECT USING (client_id = auth.uid() OR dietitian_id = auth.uid());
CREATE POLICY "assignments_select_admin" ON client_dietitian_assignments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "assignments_insert" ON client_dietitian_assignments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "assignments_update" ON client_dietitian_assignments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "assignments_delete" ON client_dietitian_assignments FOR DELETE USING (is_admin(auth.uid()));

-- GYM SETTINGS
CREATE POLICY "gym_settings_select" ON gym_settings FOR SELECT USING (TRUE);
CREATE POLICY "gym_settings_update" ON gym_settings FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "gym_settings_insert" ON gym_settings FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid() OR recipient_type = 'admin' AND is_admin(auth.uid()));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (recipient_id = auth.uid() OR is_admin(auth.uid()));

-- PAYMENTS
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "payments_select_admin" ON payments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- TRAINER REQUESTS
CREATE POLICY "trainer_requests_select_own" ON trainer_requests FOR SELECT USING (client_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "trainer_requests_select_admin" ON trainer_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "trainer_requests_insert" ON trainer_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "trainer_requests_update" ON trainer_requests FOR UPDATE USING (is_admin(auth.uid()));

-- LOYALTY REWARDS
CREATE POLICY "loyalty_rewards_select" ON loyalty_rewards FOR SELECT USING (TRUE);
CREATE POLICY "loyalty_rewards_admin" ON loyalty_rewards FOR ALL USING (is_admin(auth.uid()));

-- ===========================================
-- STEP 8: CREATE INDEXES
-- ===========================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_registration_requests_status ON registration_requests(status);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_trainer ON bookings(trainer_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_attendance_client ON attendance(client_id);
CREATE INDEX idx_attendance_date ON attendance(check_in_date);
CREATE INDEX idx_workout_logs_client ON workout_logs(client_id);
CREATE INDEX idx_body_compositions_client ON body_compositions(client_id);
CREATE INDEX idx_body_compositions_date ON body_compositions(measurement_date);
CREATE INDEX idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX idx_diet_plans_status ON diet_plans(status);
CREATE INDEX idx_meal_logs_client ON meal_logs(client_id);
CREATE INDEX idx_meal_logs_date ON meal_logs(meal_date);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_client_dietitian_assignments_active ON client_dietitian_assignments(dietitian_id, is_active);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

-- ===========================================
-- DONE! Database setup complete.
-- ===========================================

SELECT 'Database setup complete!' as message;
