-- ================================================================
-- SWEATBOX GYM - FIXES AND SUBSCRIPTION TIERS UPDATE
-- ================================================================
-- Run this file in Supabase SQL Editor to:
-- 1. Assign test client to test dietitian
-- 2. Update subscription types to 4-tier system
-- ================================================================

-- ========================================
-- PART 1: ASSIGN TEST CLIENT TO DIETITIAN
-- ========================================

DO $$
DECLARE
    v_client_id UUID;
    v_dietitian_id UUID;
    v_admin_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO v_client_id FROM profiles WHERE email = 'client@sweatboxgym.com';
    SELECT id INTO v_dietitian_id FROM profiles WHERE email = 'dietitian@sweatboxgym.com';
    SELECT id INTO v_admin_id FROM profiles WHERE email = 'admin@sweatboxgym.com';
    
    IF v_client_id IS NULL THEN
        RAISE NOTICE 'Client not found - skipping assignment';
        RETURN;
    END IF;
    
    IF v_dietitian_id IS NULL THEN
        RAISE NOTICE 'Dietitian not found - skipping assignment';
        RETURN;
    END IF;
    
    -- Check if assignment already exists
    IF NOT EXISTS (
        SELECT 1 FROM client_dietitian_assignments 
        WHERE client_id = v_client_id AND dietitian_id = v_dietitian_id
    ) THEN
        -- Create the assignment
        INSERT INTO client_dietitian_assignments (client_id, dietitian_id, assigned_by, is_active, notes)
        VALUES (v_client_id, v_dietitian_id, COALESCE(v_admin_id, v_dietitian_id), true, 'Initial assignment');
        
        RAISE NOTICE 'Assignment created: Client -> Dietitian';
    ELSE
        -- Update existing assignment to be active
        UPDATE client_dietitian_assignments 
        SET is_active = true 
        WHERE client_id = v_client_id AND dietitian_id = v_dietitian_id;
        
        RAISE NOTICE 'Existing assignment activated';
    END IF;
    
    -- Update client_profiles with assigned_dietitian_id
    UPDATE client_profiles 
    SET assigned_dietitian_id = v_dietitian_id 
    WHERE user_id = v_client_id;
    
    RAISE NOTICE 'Client ID: %', v_client_id;
    RAISE NOTICE 'Dietitian ID: %', v_dietitian_id;
END $$;

-- Verify the assignment
SELECT 
    cda.id as assignment_id,
    p_client.full_name as client_name,
    p_client.email as client_email,
    p_dietitian.full_name as dietitian_name,
    p_dietitian.email as dietitian_email,
    cda.is_active,
    cda.assigned_at
FROM client_dietitian_assignments cda
JOIN profiles p_client ON p_client.id = cda.client_id
JOIN profiles p_dietitian ON p_dietitian.id = cda.dietitian_id
WHERE cda.is_active = true;


-- ========================================
-- PART 2: IMPLEMENT 4-TIER SUBSCRIPTION SYSTEM
-- ========================================
-- New subscription tiers:
--   1. normal_gym - Basic gym access only (no PT, no dietitian)
--   2. with_pt - Gym access + Personal Training
--   3. with_dietitian - Gym access + Dietitian/Nutrition
--   4. premium - Gym access + PT + Dietitian (full package)
-- ========================================

-- Step 1: Create the new subscription type enum (keep old one for now)
DO $$
BEGIN
    -- Check if the enum already has the new values
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'normal_gym' AND enumtypid = 'subscription_type'::regtype) THEN
        ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'normal_gym';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'with_dietitian' AND enumtypid = 'subscription_type'::regtype) THEN
        ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'with_dietitian';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'premium' AND enumtypid = 'subscription_type'::regtype) THEN
        ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'premium';
    END IF;
END $$;

-- Step 2: Create a subscription_tiers table for detailed tier configuration
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
    max_pt_sessions_per_month INTEGER,
    max_dietitian_sessions_per_month INTEGER,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Insert the 4 subscription tiers
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
        '[
            {"en": "Unlimited gym access", "ar": "دخول غير محدود للصالة"},
            {"en": "All equipment usage", "ar": "استخدام جميع المعدات"},
            {"en": "Locker room access", "ar": "استخدام غرف تبديل الملابس"},
            {"en": "Free WiFi", "ar": "واي فاي مجاني"}
        ]'::jsonb
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
        '[
            {"en": "Everything in Normal Gym", "ar": "كل ما في عضوية الصالة"},
            {"en": "8 PT sessions per month", "ar": "8 جلسات تدريب شخصي شهرياً"},
            {"en": "Personalized workout plan", "ar": "خطة تمارين مخصصة"},
            {"en": "Progress tracking", "ar": "متابعة التقدم"},
            {"en": "Direct trainer messaging", "ar": "تواصل مباشر مع المدرب"}
        ]'::jsonb
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
        '[
            {"en": "Everything in Normal Gym", "ar": "كل ما في عضوية الصالة"},
            {"en": "4 dietitian sessions per month", "ar": "4 جلسات تغذية شهرياً"},
            {"en": "Custom diet plan", "ar": "خطة غذائية مخصصة"},
            {"en": "Body composition analysis", "ar": "تحليل تركيب الجسم"},
            {"en": "Meal tracking support", "ar": "دعم تتبع الوجبات"}
        ]'::jsonb
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
        '[
            {"en": "Everything in all plans", "ar": "كل ما في جميع الباقات"},
            {"en": "12 PT sessions per month", "ar": "12 جلسة تدريب شخصي شهرياً"},
            {"en": "4 dietitian sessions per month", "ar": "4 جلسات تغذية شهرياً"},
            {"en": "Priority booking", "ar": "أولوية في الحجز"},
            {"en": "Free supplements consultation", "ar": "استشارة مكملات مجانية"},
            {"en": "VIP locker", "ar": "خزانة VIP"},
            {"en": "Guest passes (2/month)", "ar": "تصاريح ضيوف (2 شهرياً)"}
        ]'::jsonb
    )
ON CONFLICT (tier_code) DO UPDATE SET
    tier_name = EXCLUDED.tier_name,
    tier_name_ar = EXCLUDED.tier_name_ar,
    description = EXCLUDED.description,
    description_ar = EXCLUDED.description_ar,
    includes_gym = EXCLUDED.includes_gym,
    includes_pt = EXCLUDED.includes_pt,
    includes_dietitian = EXCLUDED.includes_dietitian,
    monthly_price = EXCLUDED.monthly_price,
    quarterly_price = EXCLUDED.quarterly_price,
    yearly_price = EXCLUDED.yearly_price,
    max_pt_sessions_per_month = EXCLUDED.max_pt_sessions_per_month,
    max_dietitian_sessions_per_month = EXCLUDED.max_dietitian_sessions_per_month,
    display_order = EXCLUDED.display_order,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Step 4: Add tier_id column to subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'tier_id'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN tier_id UUID REFERENCES subscription_tiers(id);
    END IF;
END $$;

-- Step 5: Update existing subscriptions to use the new tier system
UPDATE subscriptions s
SET tier_id = (
    SELECT id FROM subscription_tiers 
    WHERE tier_code = CASE 
        WHEN s.subscription_type::text = 'open_gym' THEN 'normal_gym'
        WHEN s.subscription_type::text = 'with_pt' THEN 'with_pt'
        ELSE 'normal_gym'
    END
)
WHERE tier_id IS NULL;

-- Step 6: Create a function to check if client has PT access
CREATE OR REPLACE FUNCTION client_has_pt_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id 
        AND s.status = 'active'
        AND t.includes_pt = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to check if client has dietitian access
CREATE OR REPLACE FUNCTION client_has_dietitian_access(p_client_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM subscriptions s
        JOIN subscription_tiers t ON t.id = s.tier_id
        WHERE s.client_id = p_client_id 
        AND s.status = 'active'
        AND t.includes_dietitian = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Enable RLS on subscription_tiers
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view subscription tiers (public pricing)
CREATE POLICY "subscription_tiers_select" ON subscription_tiers FOR SELECT USING (TRUE);

-- Only admins can manage tiers
CREATE POLICY "subscription_tiers_admin" ON subscription_tiers FOR ALL USING (is_admin(auth.uid()));

-- Step 9: Update the test client's subscription to Premium for testing
DO $$
DECLARE
    v_client_id UUID;
    v_premium_tier_id UUID;
BEGIN
    SELECT id INTO v_client_id FROM profiles WHERE email = 'client@sweatboxgym.com';
    SELECT id INTO v_premium_tier_id FROM subscription_tiers WHERE tier_code = 'premium';
    
    IF v_client_id IS NOT NULL AND v_premium_tier_id IS NOT NULL THEN
        -- Update existing subscription or create new one
        INSERT INTO subscriptions (client_id, subscription_type, tier_id, status, start_date, end_date)
        VALUES (v_client_id, 'with_pt'::subscription_type, v_premium_tier_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year')
        ON CONFLICT (client_id) 
        DO UPDATE SET tier_id = v_premium_tier_id, status = 'active', end_date = CURRENT_DATE + INTERVAL '1 year';
        
        RAISE NOTICE 'Test client upgraded to Premium tier';
    END IF;
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- View all subscription tiers
SELECT 
    tier_code, 
    tier_name, 
    includes_gym, 
    includes_pt, 
    includes_dietitian,
    monthly_price,
    display_order
FROM subscription_tiers 
ORDER BY display_order;

-- View client-dietitian assignments
SELECT 
    p.full_name as client,
    d.full_name as dietitian,
    cda.is_active
FROM client_dietitian_assignments cda
JOIN profiles p ON p.id = cda.client_id
JOIN profiles d ON d.id = cda.dietitian_id;

-- View client subscriptions with tier info
SELECT 
    p.full_name as client,
    t.tier_name,
    t.includes_pt,
    t.includes_dietitian,
    s.status,
    s.end_date
FROM subscriptions s
JOIN profiles p ON p.id = s.client_id
LEFT JOIN subscription_tiers t ON t.id = s.tier_id;
