# SweatBox Gym - Project Audit Report

**Date:** February 20, 2025  
**Scope:** Full codebase review - Supabase, Mobile (Flutter), Admin (Next.js), Dietitian (Next.js)

---

## Executive Summary

The project has a solid architecture with Flutter mobile app, Next.js admin and dietitian dashboards, and Supabase backend. However, **several critical schema mismatches and bugs** were found that would cause runtime failures. This report documents all findings and the fixes applied.

---

## 1. Critical Bugs (Must Fix)

### 1.1 Register Edge Function - Missing `fitnessGoal`
**Location:** `supabase/functions/register/index.ts`  
**Issue:** The mobile app sends `fitnessGoal` in the registration request, but the Edge Function does not extract or store it.  
**Impact:** User fitness goals are never saved during registration.  
**Fix:** Added `fitnessGoal` to request parsing and insert.

### 1.2 Subscription Type Mismatch
**Location:** `supabase/COMPLETE_SETUP_V2.sql` vs. mobile/admin/dietitian code  
**Issue:** Database enum has `('normal_gym', 'with_pt', 'with_dietitian', 'premium')` but code uses `open_gym`.  
**Impact:** Registration and login would fail with "invalid enum value" when using `open_gym`.  
**Fix:** Added `open_gym` to subscription_type enum via migration (alias for basic gym).

### 1.3 Login Edge Function - Subscription Table Schema
**Location:** `supabase/functions/login/index.ts`  
**Issue:** Inserts `price_usd`, `pt_sessions_included` into `subscriptions`, but COMPLETE_SETUP_V2 schema has different columns (tier_id, subscription_type, no price_usd).  
**Impact:** Login after approval would fail with column errors.  
**Fix:** Updated login to use subscription_type and map open_gym → normal_gym for tier lookup.

### 1.4 Bookings Table - Column Name Mismatch
**Location:** `supabase/COMPLETE_SETUP_V2.sql`  
**Issue:** Schema uses `booking_date` but mobile, admin, and booking_model use `scheduled_date`.  
**Impact:** All booking queries would fail.  
**Fix:** Added migration to add `scheduled_date` (or rename) for compatibility.

### 1.5 Workout Screen - Missing Tables
**Location:** `mobile/lib/features/client/presentation/screens/workout_screen.dart`  
**Issue:** Uses `workout_sessions` and `exercise_logs` tables which do not exist. Schema only has `workout_logs` (different structure).  
**Impact:** Workout feature would crash with "relation does not exist".  
**Fix:** Created `workout_sessions` and `exercise_logs` tables in schema migration.

### 1.6 Exercises Table - Missing Columns
**Location:** `supabase/COMPLETE_SETUP_V2.sql`  
**Issue:** Exercises table lacks `is_active`, `is_cardio`, `instructions`, `tips`, `secondary_muscles`. Mobile workout screen expects these.  
**Impact:** Workout screen queries would fail or return null.  
**Fix:** Added missing columns via migration.

---

## 2. Moderate Issues

### 2.1 Hardcoded Supabase Credentials
**Location:** `mobile/lib/core/config/env_config.dart`  
**Issue:** Default values contain actual Supabase URL and anon key.  
**Impact:** Security risk if repo is public; keys could be exposed.  
**Recommendation:** Remove default values; require dart-define or .env in production.

### 2.2 Multiple SQL Setup Files
**Location:** `supabase/` folder  
**Issue:** COMPLETE_SETUP_V2.sql, COMPLETE_FRESH_SETUP.sql, FIXES_AND_SUBSCRIPTION_TIERS.sql, etc. - unclear which is source of truth.  
**Recommendation:** Consolidate to single migration path. Use `supabase/migrations/` folder for versioned migrations.

### 2.3 Setup Docs Reference Missing File
**Location:** `docs/setup.md`  
**Issue:** References `supabase/migrations/001_initial_schema.sql` which does not exist.  
**Fix:** Updated to reference COMPLETE_SETUP_V2.sql.

---

## 3. Duplications Check

### 3.1 Supabase Client Initialization
- **Mobile:** `Supabase.instance.client` (initialized in main.dart)
- **Admin:** `lib/supabase.ts` - createClient
- **Dietitian:** `lib/supabase.ts` - createClient  

**Assessment:** Each platform needs its own client - no unnecessary duplication.

### 3.2 Edge Function Boilerplate
- All Edge Functions repeat: CORS headers, env vars, createClient.  
**Assessment:** Acceptable - Deno Edge Functions don't share code easily. Could extract to shared import if desired.

### 3.3 Type Definitions
- Admin and Dietitian have separate Profile/Client types.  
**Assessment:** Minor duplication; could share via monorepo package. Not critical.

---

## 4. Platform Functionality Summary

| Platform   | Status | Notes                                              |
|-----------|--------|----------------------------------------------------|
| Mobile    | ⚠️     | Workout screen would fail; auth fallback works     |
| Admin     | ⚠️     | Uses open_gym, scheduled_date - needs schema fix   |
| Dietitian | ✅     | Uses body_compositions, diet_plans - aligned      |
| Supabase  | ⚠️     | Edge functions need fixes; schema inconsistencies |

---

## 5. Simplicity Assessment

- **Architecture:** Clean separation (mobile, admin, dietitian, Supabase)
- **Auth flow:** Registration → Admin approval → Login is clear
- **Code structure:** Feature-based in mobile; reasonable in Next.js apps
- **Verdict:** Simplicity is acceptable. Main issues are schema alignment, not over-engineering.

---

## 6. Fixes Applied

1. **Register function:** Added `fitnessGoal` parameter
2. **SCHEMA_FIXES.sql:** New migration for open_gym, scheduled_date, workout_sessions, exercise_logs, exercises columns
3. **Login function:** Updated subscription insert for COMPLETE_SETUP_V2 schema
4. **docs/setup.md:** Corrected migration file reference

---

## 7. Recommended Next Steps

1. Run `supabase/SCHEMA_FIXES.sql` on your Supabase project (after COMPLETE_SETUP_V2)
2. Deploy updated Edge Functions (register, login)
3. Remove hardcoded credentials from env_config.dart for production
4. Add `supabase/migrations/` folder and migrate to versioned migrations for future changes
