# SweatBox Gym - Complete Supabase Setup (A to Z)

This guide ensures your Supabase backend is fully configured and functioning.

---

## Prerequisites

- Node.js 18+
- Supabase CLI: `npm install -g supabase`
- Database password (from Supabase Dashboard → Settings → Database)

---

## Step 1: Link Project (One-Time)

```powershell
cd c:\Users\Lenovo\Desktop\gymapplication-main
npx supabase link --project-ref jucjlxepcfhhlzieovmh
# Enter your database password when prompted (from Dashboard → Settings → Database)
```

---

## Step 2: Database Setup

### Option A: Fresh Project (No Data)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `COMPLETE_SETUP_V2.sql` (creates all tables, RLS, functions)
3. Run `INITIAL_FOOD_DATABASE.sql` (seeds food data for dietitian)
4. Run `CREATE_ADMIN.sql` or `CREATE_ADMIN_PROFILE.sql` to create admin user

### Option B: Existing Project (Migrations Only)

```powershell
npx supabase db push
```

---

## Step 3: Deploy All Edge Functions

```powershell
.\supabase\deploy-all.ps1
```

Or manually:

```powershell
npx supabase functions deploy login --no-verify-jwt
npx supabase functions deploy register --no-verify-jwt
npx supabase functions deploy approve-registration
npx supabase functions deploy admin-action
npx supabase functions deploy dietitian-action
npx supabase functions deploy diet-plan
npx supabase functions deploy body-composition
npx supabase functions deploy meal-log
```

---

## Step 4: Verify Deployment

### Edge Functions (8 total)

| Function | URL | Auth Required |
|----------|-----|----------------|
| login | `/functions/v1/login` | No |
| register | `/functions/v1/register` | No |
| approve-registration | `/functions/v1/approve-registration` | Yes (admin) |
| admin-action | `/functions/v1/admin-action` | Yes (admin) |
| dietitian-action | `/functions/v1/dietitian-action` | Yes (dietitian/admin) |
| diet-plan | `/functions/v1/diet-plan` | Yes |
| body-composition | `/functions/v1/body-composition` | Yes |
| meal-log | `/functions/v1/meal-log` | Yes |

Check: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions

### Database Tables (from COMPLETE_SETUP_V2)

- profiles, registration_requests
- trainer_profiles, client_profiles, dietitian_profiles
- subscription_tiers, subscriptions
- availability, bookings, attendance
- exercises, workout_sessions, exercise_logs, workout_logs
- body_compositions
- foods, diet_plans, diet_plan_meals, diet_plan_meal_items
- meal_logs, meal_log_items
- client_dietitian_assignments
- loyalty_tracking, loyalty_rewards
- notifications, payments, trainer_requests
- gym_settings

---

## Step 5: Optional Enhancements

Run in SQL Editor when needed:

- `FIXES_AND_SUBSCRIPTION_TIERS.sql` - 4-tier subscription migration
- `DIET_PLAN_ENHANCEMENTS.sql` - Diet plan features
- `ADD_CHEAT_DAYS.sql` - Cheat days for diet plans
- `FIX_DELETE_POLICIES.sql` - RLS policy fixes

---

## Troubleshooting

### Function not showing in dashboard
- Wait 1–2 minutes and refresh
- Redeploy: `npx supabase functions deploy <name>`

### Migration fails
- Ensure COMPLETE_SETUP_V2.sql was run first (for fresh projects)
- Check migration history: `npx supabase migration list`

### "Not authenticated" on Edge Functions
- Pass `Authorization: Bearer <access_token>` header
- For login/register, use `--no-verify-jwt` (already set in deploy script)
