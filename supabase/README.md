# SweatBox Gym - Supabase

## Quick Start - Deploy Everything

```powershell
# 1. Link (one-time, needs database password)
npx supabase link --project-ref jucjlxepcfhhlzieovmh

# 2. Deploy all (migrations + 8 Edge Functions)
.\supabase\deploy-all.ps1
```

**Full setup guide:** See [SUPABASE_COMPLETE_SETUP.md](./SUPABASE_COMPLETE_SETUP.md)

## Structure

| Path | Purpose |
|------|---------|
| `migrations/` | Versioned schema changes (use `supabase db push`) |
| `functions/` | Edge Functions (use `supabase functions deploy`) |
| `config.toml` | Supabase CLI configuration |

## SQL Files (Manual / One-time)

Run these in Supabase Dashboard → SQL Editor when needed:

| File | When to Use |
|------|-------------|
| `COMPLETE_SETUP_V2.sql` | Fresh project setup (run first) |
| `INITIAL_FOOD_DATABASE.sql` | Seed food database |
| `DIET_PLAN_ENHANCEMENTS.sql` | Diet plan features |
| `ADD_CHEAT_DAYS.sql` | Cheat days feature |
| `FIXES_AND_SUBSCRIPTION_TIERS.sql` | 4-tier subscription migration |
| `FIX_DELETE_POLICIES.sql` | RLS policy fixes |
| `CREATE_ADMIN.sql` | Create admin user |
| `CREATE_ADMIN_PROFILE.sql` | Create admin profile |

**Note:** `SCHEMA_FIXES.sql` is now in `migrations/` – use `supabase db push` instead.
