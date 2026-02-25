# SweatBox Gym - Database Schema

Complete documentation of the PostgreSQL database schema.

## Entity Relationship Overview

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   profiles  │────<│ trainer_profiles│     │ client_profiles │
│  (all users)│     └─────────────────┘     └─────────────────┘
└─────────────┘              │                       │
       │                     │                       │
       │              ┌──────┴───────┐               │
       │              │              │               │
       ▼              ▼              ▼               ▼
┌─────────────┐  ┌─────────┐  ┌─────────────┐  ┌─────────────┐
│subscriptions│  │ bookings │  │body_metrics │  │ diet_plans  │
└─────────────┘  └─────────┘  └─────────────┘  └─────────────┘
       │
       ▼
┌─────────────┐
│  payments   │
└─────────────┘
```

---

## Core Tables

### profiles
Extends Supabase `auth.users` with application-specific data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | Unique email address |
| full_name | TEXT | User's full name |
| phone | TEXT | Phone number (optional) |
| avatar_url | TEXT | URL to avatar image |
| role | user_role | 'client', 'trainer', or 'admin' |
| date_of_birth | DATE | For age calculation |
| gender | TEXT | 'male', 'female', 'other' |
| emergency_contact_name | TEXT | Emergency contact |
| emergency_contact_phone | TEXT | Emergency phone |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

### trainer_profiles
Additional data for users with trainer role.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles.id |
| specializations | TEXT[] | Array: ['strength', 'cardio'] |
| bio | TEXT | Trainer biography |
| experience_years | INTEGER | Years of experience |
| certifications | TEXT[] | List of certifications |
| hourly_rate | DECIMAL | Rate per session (USD) |
| is_active | BOOLEAN | Can accept new clients |
| max_clients | INTEGER | Maximum client capacity |

### client_profiles
Additional data for gym members.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References profiles.id |
| assigned_trainer_id | UUID | References trainer_profiles.id |
| goal | goal_type | Training goal |
| goal_description | TEXT | Detailed goal description |
| medical_notes | TEXT | Health considerations |
| fitness_level | INTEGER | 1-10 scale |

---

## Subscription & Payments

### subscriptions
Gym membership and PT package tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| type | subscription_type | 'open_gym' ($75) or 'with_pt' ($200) |
| status | subscription_status | 'active', 'expired', 'cancelled', 'frozen' |
| price_usd | DECIMAL | Monthly price |
| start_date | DATE | Subscription start |
| end_date | DATE | Subscription end |
| pt_sessions_included | INTEGER | PT sessions in package |
| pt_sessions_used | INTEGER | Sessions consumed |
| auto_renew | BOOLEAN | Auto-renewal setting |

### payments
Payment transaction records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| subscription_id | UUID | References subscriptions.id |
| client_id | UUID | References profiles.id |
| amount_usd | DECIMAL | Payment amount |
| payment_method | TEXT | 'cash', 'card', 'bank_transfer' |
| payment_date | TIMESTAMPTZ | When payment was made |
| recorded_by | UUID | Admin who recorded it |

---

## Scheduling

### trainer_availability
Defines when trainers are available for booking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| trainer_id | UUID | References trainer_profiles.id |
| day_of_week | INTEGER | 0=Sunday through 6=Saturday |
| start_time | TIME | Available from |
| end_time | TIME | Available until |
| is_recurring | BOOLEAN | Repeats weekly |
| specific_date | DATE | For one-off changes |
| is_available | BOOLEAN | Available or blocked |

### bookings
PT session appointments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| trainer_id | UUID | References trainer_profiles.id |
| scheduled_date | DATE | Session date |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| status | booking_status | 'pending', 'confirmed', 'completed', 'cancelled', 'no_show' |
| session_type | TEXT | 'strength', 'cardio', etc. |
| notes | TEXT | General notes |
| client_notes | TEXT | Notes from client |
| trainer_notes | TEXT | Notes from trainer post-session |
| cancelled_by | UUID | Who cancelled |
| cancelled_at | TIMESTAMPTZ | When cancelled |
| cancellation_reason | TEXT | Why cancelled |
| reminder_sent | BOOLEAN | Notification sent |

---

## Body Tracking

### body_metrics
Body measurements and composition data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| recorded_by | UUID | Self or trainer |
| measurement_date | DATE | When measured |
| weight_kg | DECIMAL | Body weight |
| height_cm | DECIMAL | Height |
| bmi | DECIMAL | Auto-calculated BMI |
| body_fat_percentage | DECIMAL | Body fat % |
| muscle_mass_kg | DECIMAL | Muscle mass |
| water_percentage | DECIMAL | Body water % |
| bone_mass_kg | DECIMAL | Bone mass |
| bmr_calories | INTEGER | Basal metabolic rate |
| visceral_fat_level | INTEGER | Visceral fat rating |
| metabolic_age | INTEGER | Metabolic age |
| chest_cm | DECIMAL | Chest circumference |
| waist_cm | DECIMAL | Waist circumference |
| hips_cm | DECIMAL | Hip circumference |
| left_arm_cm | DECIMAL | Left arm circumference |
| right_arm_cm | DECIMAL | Right arm circumference |
| left_thigh_cm | DECIMAL | Left thigh circumference |
| right_thigh_cm | DECIMAL | Right thigh circumference |

**Note:** BMI is auto-calculated via trigger when weight and height are provided.

### fitness_assessments
Periodic fitness tests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| trainer_id | UUID | References trainer_profiles.id |
| assessment_date | DATE | Assessment date |
| resting_heart_rate | INTEGER | BPM at rest |
| vo2_max | DECIMAL | VO2 max estimate |
| bench_press_1rm_kg | DECIMAL | Bench 1 rep max |
| squat_1rm_kg | DECIMAL | Squat 1 rep max |
| deadlift_1rm_kg | DECIMAL | Deadlift 1 rep max |
| plank_duration_seconds | INTEGER | Plank hold time |
| pushups_count | INTEGER | Max pushups |
| pullups_count | INTEGER | Max pullups |
| overall_score | DECIMAL | Computed fitness score |

---

## Diet & Nutrition

### diet_plans
Trainer-assigned meal plans.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| trainer_id | UUID | References trainer_profiles.id |
| name | TEXT | Plan name |
| description | TEXT | Plan overview |
| daily_calories | INTEGER | Target calories |
| protein_grams | INTEGER | Daily protein target |
| carbs_grams | INTEGER | Daily carbs target |
| fat_grams | INTEGER | Daily fat target |
| start_date | DATE | Plan start |
| end_date | DATE | Plan end |
| is_active | BOOLEAN | Currently active plan |

### meal_logs
Client meal tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | References profiles.id |
| log_date | DATE | Date of meal |
| meal_type | meal_type | 'breakfast', 'lunch', 'dinner', 'snack' |
| description | TEXT | What was eaten |
| calories | INTEGER | Calorie estimate |
| protein_grams | INTEGER | Protein content |
| carbs_grams | INTEGER | Carbs content |
| fat_grams | INTEGER | Fat content |
| photo_url | TEXT | Meal photo |

---

## Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('client', 'trainer', 'admin');

-- Booking status
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Subscription types
CREATE TYPE subscription_type AS ENUM ('open_gym', 'with_pt');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'frozen');

-- Meal types
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Goal types
CREATE TYPE goal_type AS ENUM ('weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'strength', 'flexibility');
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

1. **Profiles**: Viewable by all, editable by owner
2. **Bookings**: Visible to client, trainer, or admin
3. **Body Metrics**: Visible to client, assigned trainer, or admin
4. **Subscriptions**: Full access for admins only
5. **Notifications**: Users see only their own

---

## Indexes

```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_body_metrics_date ON body_metrics(measurement_date);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
```

---

## Triggers

1. **BMI Auto-calculation**: Computes BMI when weight/height are inserted/updated
2. **Updated_at**: Automatically updates timestamp on row modification
