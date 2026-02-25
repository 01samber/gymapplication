# SweatBox Gym - Complete Setup Guide

## Overview
This project consists of:
- **Mobile App** (Flutter) - For clients and trainers
- **Admin Dashboard** (Next.js) - For gym administrators
- **Dietitian Dashboard** (Next.js) - For dietitians to manage client nutrition

All apps connect to **Supabase** as the backend.

---

## STEP 1: Database Setup (Required First!)

### 1.1 Run the Complete Database Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Copy and paste the ENTIRE contents of `supabase/COMPLETE_FRESH_SETUP.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Wait for it to complete - you should see "DATABASE SETUP COMPLETE!" at the bottom

### 1.2 Add Food Database

1. Still in SQL Editor, click **+ New query**
2. Copy and paste the ENTIRE contents of `supabase/SEED_FOODS.sql`
3. Click **Run**
4. You should see a count of ~110 foods added

### 1.3 Create Your Admin Account

1. Still in SQL Editor, click **+ New query**
2. Run this SQL (change email and password!):

```sql
-- IMPORTANT: Change these values to your actual admin credentials!
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Create the auth user (this creates the login credentials)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'admin@sweatboxgym.com',  -- CHANGE THIS TO YOUR EMAIL
        crypt('Admin123!', gen_salt('bf')),  -- CHANGE THIS TO YOUR PASSWORD
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "admin"}',
        'authenticated',
        'authenticated'
    )
    RETURNING id INTO new_user_id;

    -- Create the profile with admin role
    INSERT INTO profiles (id, email, role, full_name, phone, status)
    VALUES (new_user_id, 'admin@sweatboxgym.com', 'admin', 'Admin User', '+966500000000', 'active');

    RAISE NOTICE 'Admin created with ID: %', new_user_id;
END $$;
```

3. **IMPORTANT**: Change `admin@sweatboxgym.com` and `Admin123!` to your desired credentials
4. Click **Run**

### 1.4 Create a Test Dietitian Account (Optional but Recommended)

```sql
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'dietitian@sweatboxgym.com',  -- CHANGE THIS
        crypt('Dietitian123!', gen_salt('bf')),  -- CHANGE THIS
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "dietitian"}',
        'authenticated', 'authenticated'
    )
    RETURNING id INTO new_user_id;

    INSERT INTO profiles (id, email, role, full_name, phone, status)
    VALUES (new_user_id, 'dietitian@sweatboxgym.com', 'dietitian', 'Test Dietitian', '+966500000001', 'active');

    INSERT INTO dietitian_profiles (user_id, specialization, years_experience)
    VALUES (new_user_id, 'Sports Nutrition', 5);

    RAISE NOTICE 'Dietitian created with ID: %', new_user_id;
END $$;
```

---

## STEP 2: Install Dependencies

Open **PowerShell** and run these commands:

### 2.1 Admin Dashboard
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\admin
npm install
```

### 2.2 Dietitian Dashboard
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\dietitian
npm install
```

### 2.3 Mobile App
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\mobile
flutter pub get
```

---

## STEP 3: Start the Applications

### Option A: Start All at Once (Recommended)

Open **THREE separate PowerShell/Terminal windows**:

**Terminal 1 - Admin Dashboard:**
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\admin
npm run dev
```
Opens at: http://localhost:3000

**Terminal 2 - Dietitian Dashboard:**
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\dietitian
npm run dev
```
Opens at: http://localhost:3002

**Terminal 3 - Mobile App:**
```powershell
cd c:\Users\Lenovo\Desktop\sweatboxgym\mobile
flutter run -d chrome
```
Opens in Chrome browser (or connect a physical device/emulator)

---

## STEP 4: Test the System

### 4.1 Test Admin Dashboard
1. Open http://localhost:3000
2. Login with your admin credentials (e.g., `admin@sweatboxgym.com` / `Admin123!`)
3. You should see the admin dashboard with:
   - User management
   - Registration requests (pending approvals)
   - Gym statistics

### 4.2 Test Dietitian Dashboard
1. Open http://localhost:3002
2. Login with dietitian credentials (e.g., `dietitian@sweatboxgym.com` / `Dietitian123!`)
3. You should see:
   - Assigned clients list (empty initially)
   - Food database
   - Diet plan management

### 4.3 Test Mobile App Registration
1. Open the mobile app in Chrome
2. Try registering a new client:
   - Fill in name, email, password
   - Select "Client" role
   - Submit registration
3. Go to Admin Dashboard → Registration Requests
4. Approve the registration
5. Now the client can login via mobile app

---

## STEP 5: Connect Client to Dietitian

After a client is registered and approved:

### Via Admin Dashboard:
1. Login to Admin Dashboard
2. Go to Users section
3. Find the client
4. Assign them to a dietitian

### Via SQL (Alternative):
```sql
-- Get IDs first
SELECT id, email, role FROM profiles WHERE role IN ('client', 'dietitian');

-- Then assign (replace with actual IDs)
INSERT INTO client_dietitian_assignments (client_id, dietitian_id, assigned_at, status)
VALUES (
    'CLIENT_ID_HERE',  -- Replace with actual client UUID
    'DIETITIAN_ID_HERE',  -- Replace with actual dietitian UUID
    NOW(),
    'active'
);
```

After assignment:
- Dietitian can see the client in their dashboard
- Dietitian can create diet plans for the client
- Dietitian can track client's body composition

---

## Quick Reference

| Application | URL | Port |
|-------------|-----|------|
| Admin Dashboard | http://localhost:3000 | 3000 |
| Dietitian Dashboard | http://localhost:3002 | 3002 |
| Mobile App (Web) | http://localhost:xxxxx | Dynamic |
| Supabase Dashboard | https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh | - |

---

## Troubleshooting

### "Invalid login credentials"
- Make sure you ran the admin/dietitian creation SQL
- Verify the email and password match exactly
- Check the profiles table has the user with correct role

### "Registration failed"
- Verify the `register` Edge Function is deployed
- Check Supabase logs for errors

### Port already in use
- Kill the process using the port:
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID_NUMBER> /F
  ```

### Mobile app won't connect
- Ensure Supabase URL and anon key are correct in `mobile/lib/core/config/env_config.dart`
- Check network connectivity

---

## Architecture Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  Mobile App      │────▶│                 │
│   (Gym User)│     │  (Flutter)       │     │                 │
└─────────────┘     └──────────────────┘     │                 │
                                              │                 │
┌─────────────┐     ┌──────────────────┐     │   SUPABASE      │
│   Admin     │────▶│  Admin Dashboard │────▶│   - Database    │
│             │     │  (Next.js:3000)  │     │   - Auth        │
└─────────────┘     └──────────────────┘     │   - Edge Funcs  │
                                              │   - Storage     │
┌─────────────┐     ┌──────────────────┐     │                 │
│  Dietitian  │────▶│  Dietitian Dash  │────▶│                 │
│             │     │  (Next.js:3002)  │     │                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Deployed Edge Functions

| Function | Purpose |
|----------|---------|
| `register` | Handle new user registration |
| `login` | Handle user authentication |
| `approve-registration` | Admin approves pending registrations |
| `admin-action` | Admin-specific operations |
| `body-composition` | Track client body metrics |
| `diet-plan` | Create/manage diet plans |
| `meal-log` | Log client meals |
| `dietitian-action` | Dietitian-specific operations |

---

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs for backend errors
2. Check browser Developer Console (F12) for frontend errors
3. Verify all environment variables are set correctly
