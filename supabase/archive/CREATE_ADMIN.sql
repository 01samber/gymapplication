-- ================================================================
-- CREATE ADMIN USER
-- ================================================================
-- Run this AFTER you create the admin user in Supabase Auth
-- 
-- STEPS:
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add user" -> "Create new user"  
-- 3. Enter email: admin@sweatboxgym.com (or your preferred email)
-- 4. Enter a strong password
-- 5. Click "Create user"
-- 6. Copy the User UID from the users list
-- 7. Replace 'YOUR-UUID-HERE' below with the copied UUID
-- 8. Run this SQL
-- ================================================================

-- Option 1: If you know the UUID (replace the placeholder)
/*
INSERT INTO profiles (id, email, full_name, role)
VALUES (
    'YOUR-UUID-HERE',  -- Replace with actual UUID
    'admin@sweatboxgym.com',  -- Replace with your admin email
    'SweatBox Admin',
    'admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/

-- Option 2: Auto-find by email (easier - just change the email)
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@sweatboxgym.com';  -- CHANGE THIS to your admin email
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users. Create the user first in Authentication -> Users', v_email;
    END IF;
    
    -- Create or update the profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, 'SweatBox Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'SweatBox Admin';
    
    RAISE NOTICE 'Admin profile created/updated for: %', v_email;
    RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verify the admin was created
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'admin';
