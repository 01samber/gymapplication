# SweatBox Gym Application – Project Structure

## Root Layout

```
gymapplication-main/
├── admin/          # Next.js admin dashboard (SWEATBOX Command Center)
├── dietitian/      # Next.js dietitian portal
├── mobile/         # Flutter client & trainer app
├── supabase/       # Database migrations, Edge Functions
├── assets/         # Shared images/assets
└── docs/           # Guides (TEST_FLOW.md, etc.)
```

## Admin (`admin/`)

- `app/dashboard/` – Dashboard pages (Members, Trainers, Nutritionists, Client Nutrition, etc.)
- `app/api/` – API routes: add-member, delete-member, dietitians, trainers, clients-list
- `components/` – Sidebar, shared UI
- `lib/` – Supabase client, utils

## Dietitian (`dietitian/`)

- `app/dashboard/` – My Clients, Diet Plans, Body Analysis
- `app/api/` – add-client (for dietitian-added clients)
- `app/set-password/` – First-login password change
- `components/` – Sidebar, Header, VideoBackground

## Mobile (`mobile/` – Flutter)

```
lib/
├── core/           # App-wide
│   ├── config/     # env_config
│   ├── router/     # app_router
│   ├── theme/      # app_colors, app_theme
│   └── widgets/    # video_background
├── features/
│   ├── auth/       # Login, register, set password
│   ├── client/     # Client home, profile, bookings, workout
│   ├── trainer/    # Trainer home, clients, schedule
│   ├── nutrition/  # Diet plans, meal log
│   ├── body_composition/
│   └── shared/
└── models/         # user_model, booking_model, etc.
```

## Supabase (`supabase/`)

- `migrations/` – SQL migrations (schema, RLS, realtime)
- `functions/` – Edge Functions (login, meal-log, diet-plan, etc.)
