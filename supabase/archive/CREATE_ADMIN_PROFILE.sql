-- =====================================================
-- CREATE ADMIN PROFILE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Insert admin profile for admin@gmail.com
-- User UID from Auth: d6a64efa-b81f-471d-84fc-1a765e040a69

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    'd6a64efa-b81f-471d-84fc-1a765e040a69',
    'admin@gmail.com',
    'Admin User',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify the profile was created
SELECT id, email, full_name, role FROM profiles WHERE email = 'admin@gmail.com';
