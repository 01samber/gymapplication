# SweatBox Gym - Supabase Full Checkup

**Project:** jucjlxepcfhhlzieovmh (sweatbox-gym)  
**Region:** Central EU (Frankfurt)

---

## ✅ Automated Checks (via CLI)

Run from project root: `cd c:\Users\Lenovo\Desktop\gymapplication-main`

| Check | Command | Expected |
|-------|---------|----------|
| Project linked | `npx supabase projects list` | ● next to jucjlxepcfhhlzieovmh |
| Migrations synced | `npx supabase migration list` | Local = Remote for all |
| Edge Functions | `npx supabase functions list` | 8 functions, all ACTIVE |

---

## 1. Edge Functions (8/8) ✅

| Function | Status | Purpose |
|----------|--------|---------|
| login | ACTIVE | User login with approval check |
| register | ACTIVE | New user registration |
| approve-registration | ACTIVE | Admin approve/reject registrations |
| admin-action | ACTIVE | Admin operations |
| dietitian-action | ACTIVE | Dietitian operations |
| diet-plan | ACTIVE | Diet plan CRUD |
| body-composition | ACTIVE | Body composition data |
| meal-log | ACTIVE | Meal logging |

**Verify:** Dashboard → Edge Functions → All 8 visible

---

## 2. Database Tables ✅

You have all 36 tables. Core tables used by the app:

- **Auth:** profiles, registration_requests, client_profiles, trainer_profiles, dietitian_profiles
- **Subscriptions:** subscription_tiers, subscriptions
- **Bookings:** availability, bookings, attendance
- **Workout:** exercises, workout_sessions, exercise_logs, workout_logs
- **Nutrition:** foods, diet_plans, diet_plan_meals, diet_plan_meal_items, meal_logs, meal_log_items
- **Body:** body_compositions
- **Other:** client_dietitian_assignments, loyalty_tracking, notifications, gym_settings, etc.

---

## 3. Storage Buckets (Dashboard Only)

**Dashboard → Storage → New bucket**

| Bucket | Type | Required For |
|--------|------|--------------|
| avatars | Public | User profile photos |
| progress-photos | Private | Client progress tracking |

**Note:** Buckets must be created in the Dashboard (RLS blocks anon-key creation).

```sql
-- Avatars: public read, authenticated upload own
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Progress photos: owner only
CREATE POLICY "Users can view their own progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. Authentication (Manual Check)

**Dashboard → Authentication → Providers**

- [ ] Email provider enabled
- [ ] Confirm email: OFF (for dev) or ON (for production)

**Dashboard → Authentication → URL Configuration**

- [ ] Site URL set (e.g. `http://localhost:3000` for dev)
- [ ] Redirect URLs include your app URLs

---

## 5. Row Level Security (RLS)

**Tables marked UNRESTRICTED** (RLS disabled or very open):

- body_metrics, client_requests, fitness_assessments
- progress_photos, push_tokens, trainer_availability
- workout_days, workout_exercises, workout_plans

**Recommendation:** Enable RLS and add policies for production. For development, acceptable.

---

## 6. Environment Variables

### Mobile (Flutter)
- Uses `env_config.dart` with defaults for jucjlxepcfhhlzieovmh
- ✅ No .env needed for dev (defaults work)

### Admin (Next.js)
- [ ] Copy `admin/.env.local.example` → `admin/.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Dietitian (Next.js)
- [ ] Copy `dietitian/.env.local.example` → `dietitian/.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Get keys:** Dashboard → Settings → API → Project URL, anon public key

---

## 7. Admin User

**Dashboard → SQL Editor** (if no admin exists):

```sql
-- After creating a user via Dashboard → Authentication → Users
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
```

---

## 8. Food Data (Dietitian)

If `foods` table is empty, run in SQL Editor:

- `supabase/INITIAL_FOOD_DATABASE.sql`

---

## Quick Verification Commands

```powershell
cd c:\Users\Lenovo\Desktop\gymapplication-main

# Full status
npx supabase projects list
npx supabase migration list
npx supabase functions list

# Deploy everything
.\supabase\deploy-all.ps1
```

---

## Summary Checklist

| Item | Status |
|------|--------|
| Project linked | ✅ |
| Migrations synced | ✅ |
| 8 Edge Functions deployed | ✅ |
| 36 Database tables | ✅ |
| Admin .env.local | ✅ Created |
| Dietitian .env.local | ✅ Created |
| Food data seeded | ✅ 17 foods via migration |
| Storage buckets (avatars, progress-photos) | ⬜ Create in Dashboard |
| Admin user created | ⬜ Create in Dashboard → Auth |
