# SweatBox Gym - Supabase Deployment Guide

This guide will walk you through setting up everything in Supabase manually.

## Your Supabase Project
**Dashboard URL**: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh

---

## STEP 1: Run SQL Scripts (Database Setup)

Go to **SQL Editor** in your Supabase dashboard:
https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/sql

### Run these SQL files IN ORDER:

#### 1.1 First: COMPLETE_FRESH_SETUP.sql
Copy the entire contents of `supabase/COMPLETE_FRESH_SETUP.sql` and run it.
This creates all tables, enums, functions, and RLS policies.

#### 1.2 Second: MIGRATION_FIXES.sql
Copy the entire contents of `supabase/MIGRATION_FIXES.sql` and run it.
This adds:
- `gym_settings` table
- `notifications` table
- `payments` table
- `trainer_requests` table
- `loyalty_rewards` table
- Unique constraints to prevent duplicates

#### 1.3 Third: Create Admin User
1. Go to **Authentication** > **Users**: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/auth/users
2. Click **Add user** > **Create new user**
3. Enter:
   - Email: `admin@sweatboxgym.com` (or your preferred email)
   - Password: A strong password
4. Click **Create user**
5. Go back to **SQL Editor** and run `supabase/CREATE_ADMIN.sql`
   - Make sure the email in the SQL matches what you used!

#### 1.4 Fourth: INITIAL_FOOD_DATABASE.sql
Copy the entire contents of `supabase/INITIAL_FOOD_DATABASE.sql` and run it.
This populates the food database with nutritional data.

---

## STEP 2: Deploy Edge Functions

Go to **Edge Functions** in your Supabase dashboard:
https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions

You need to deploy 8 Edge Functions. For each function:

1. Click **Deploy a new function** (or use CLI)
2. Create function with the exact name
3. Paste the code from the corresponding file

### Function 1: `register`
- **Name**: `register`
- **Code**: Copy from `supabase/functions/register/index.ts`

### Function 2: `login`
- **Name**: `login`
- **Code**: Copy from `supabase/functions/login/index.ts`

### Function 3: `approve-registration`
- **Name**: `approve-registration`
- **Code**: Copy from `supabase/functions/approve-registration/index.ts`

### Function 4: `admin-action`
- **Name**: `admin-action`
- **Code**: Copy from `supabase/functions/admin-action/index.ts`

### Function 5: `body-composition`
- **Name**: `body-composition`
- **Code**: Copy from `supabase/functions/body-composition/index.ts`

### Function 6: `diet-plan`
- **Name**: `diet-plan`
- **Code**: Copy from `supabase/functions/diet-plan/index.ts`

### Function 7: `dietitian-action`
- **Name**: `dietitian-action`
- **Code**: Copy from `supabase/functions/dietitian-action/index.ts`

### Function 8: `meal-log`
- **Name**: `meal-log`
- **Code**: Copy from `supabase/functions/meal-log/index.ts`

---

## STEP 3: Alternative - Deploy via CLI

If you prefer using the CLI, install Supabase CLI first:

### Windows (using Scoop)
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Login and Link
```bash
supabase login
supabase link --project-ref jucjlxepcfhhlzieovmh
```

### Deploy All Functions
```bash
supabase functions deploy register
supabase functions deploy login
supabase functions deploy approve-registration
supabase functions deploy admin-action
supabase functions deploy body-composition
supabase functions deploy diet-plan
supabase functions deploy dietitian-action
supabase functions deploy meal-log
```

---

## STEP 4: Configure Environment Variables

Each Edge Function needs access to these environment variables (automatically set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These are automatically available in Edge Functions, no manual setup needed.

---

## STEP 5: Update Frontend Environment Variables

### Admin Dashboard (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://jucjlxepcfhhlzieovmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Dietitian Dashboard (`dietitian/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://jucjlxepcfhhlzieovmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Mobile App (`mobile_app/lib/config.dart`)
Update the Supabase URL and anon key in the Flutter app.

You can find your anon key at:
https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/settings/api

---

## STEP 6: Verify Everything Works

### Test the Database
1. Go to **Table Editor**: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/editor
2. You should see all tables created
3. Check that `gym_settings` has one row with defaults
4. Check that `foods` table has ~100+ food items

### Test Edge Functions
1. Go to **Edge Functions**: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions
2. Each function should show as deployed
3. You can test functions using the built-in tester

### Test Admin Login
1. Start the admin dashboard: `cd admin && npm run dev`
2. Go to http://localhost:3000
3. Login with your admin credentials
4. You should see the dashboard

---

## File Structure (Final Clean State)

```
supabase/
├── COMPLETE_FRESH_SETUP.sql     ← Main database schema
├── MIGRATION_FIXES.sql          ← Additional fixes & constraints
├── CREATE_ADMIN.sql             ← Admin user setup
├── INITIAL_FOOD_DATABASE.sql    ← Food nutritional data
└── functions/
    ├── register/index.ts
    ├── login/index.ts
    ├── approve-registration/index.ts
    ├── admin-action/index.ts
    ├── body-composition/index.ts
    ├── diet-plan/index.ts
    ├── dietitian-action/index.ts
    └── meal-log/index.ts
```

---

## Summary of What Each Part Does

### SQL Files
| File | Purpose |
|------|---------|
| `COMPLETE_FRESH_SETUP.sql` | Creates all tables, enums, indexes, functions, RLS policies |
| `MIGRATION_FIXES.sql` | Adds gym_settings, notifications, payments, unique constraints |
| `CREATE_ADMIN.sql` | Creates admin profile for an existing auth user |
| `INITIAL_FOOD_DATABASE.sql` | Populates food database with 100+ items |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `register` | Handles new user registration requests |
| `login` | Custom login with approval status check |
| `approve-registration` | Admin approves/rejects registrations |
| `admin-action` | Admin CRUD operations (members, trainers) |
| `body-composition` | Body measurement CRUD for dietitians |
| `diet-plan` | Diet plan management |
| `dietitian-action` | Dietitian operations (clients, foods) |
| `meal-log` | Client meal logging |

---

## Troubleshooting

### "relation does not exist" error
Make sure you ran `COMPLETE_FRESH_SETUP.sql` first before other SQL files.

### "function is_admin does not exist" error
The `is_admin` function is created in `COMPLETE_FRESH_SETUP.sql`. Run that file first.

### Edge Function 500 errors
Check the function logs in the Supabase dashboard for detailed error messages.

### Authentication errors
Make sure your `.env.local` files have the correct Supabase URL and anon key.

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Edge Functions Guide: https://supabase.com/docs/guides/functions
