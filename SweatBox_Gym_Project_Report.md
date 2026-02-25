# SweatBox Gym - Project Report

---

## Executive Summary

**SweatBox Gym** is a comprehensive fitness management platform designed for a gym located in **Sarba, Jounieh, Lebanon**. The system connects four key user types—clients, personal trainers, dietitians, and administrators—through a unified ecosystem of mobile and web applications.

---

## Project Overview

| Aspect | Details |
|--------|---------|
| **Project Type** | Multi-platform Fitness Management System |
| **Target Users** | Gym clients, Personal trainers, Dietitians, Administrators |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Status** | Development/Setup Phase |

---

## Applications

The system consists of **three separate applications**, all connected to a shared Supabase backend:

### 1. Mobile App (Flutter)
- **Technology**: Flutter 3.x (Dart)
- **Target Users**: Clients and Trainers
- **Platform**: iOS, Android, Web (Chrome)
- **Key Libraries**: Riverpod (state), GoRouter (navigation), fl_chart (visualizations)

### 2. Admin Dashboard (Next.js)
- **Technology**: Next.js 14, React 18, TypeScript
- **Port**: localhost:3000
- **Target Users**: Gym Administrators
- **Key Libraries**: Tailwind CSS, Recharts, Lucide Icons

### 3. Dietitian Dashboard (Next.js)
- **Technology**: Next.js 14, React 18, TypeScript
- **Port**: localhost:3002
- **Target Users**: Nutrition Specialists
- **Key Libraries**: Same stack as Admin Dashboard

---

## Core Features

### User Management & Authentication

| Feature | Description |
|---------|-------------|
| Registration Approval Workflow | New users register → Admin reviews and approves → User can login |
| Role-Based Access | Four roles: client, trainer, admin, dietitian |
| Secure Authentication | Password hashing, Edge Functions for sensitive operations |
| Row Level Security (RLS) | Database-level access control on all tables |

### Client Features (Mobile App)
- Self-registration with approval workflow
- Check-in/check-out at the gym
- Book sessions with personal trainers
- View upcoming sessions and session history
- Track body composition metrics
- View assigned diet plans
- Log meals and track nutrition
- Monitor fitness progress over time

### Trainer Features (Mobile App)
- View and manage assigned clients
- Set availability schedules
- Confirm/complete bookings
- Add session notes
- Track client workout progress

### Admin Dashboard Features
- **User Management**: Create, edit, approve/reject users
- **Subscription Management**: open_gym ($75/month) or with_pt ($200/month)
- **Payment Recording**: Cash, card, or bank transfer (manual entry)
- **Booking Oversight**: View all PT session bookings
- **Attendance Tracking**: Monitor gym check-ins
- **Exercise Library**: Manage 70+ exercises
- **Loyalty Rewards**: Free PT month at 12, 24, 36 consecutive months
- **Analytics & Reports**: Gym statistics and insights

### Dietitian Dashboard Features
- View assigned clients
- Record body composition (InBody-style measurements)
- Create comprehensive diet plans with macro targets
- Build meal plans with scheduled meals
- Access food database (110+ foods with nutrition data)
- Monitor client meal logs and compliance
- Track client progress over time

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                             │
├─────────────────┬────────────────────┬──────────────────────────────┤
│  Mobile App     │  Admin Dashboard   │  Dietitian Dashboard         │
│  (Flutter)      │  (Next.js:3000)    │  (Next.js:3002)              │
│  Clients/       │  Administrators    │  Nutrition Specialists       │
│  Trainers       │                    │                              │
└────────┬────────┴──────────┬─────────┴──────────────┬───────────────┘
         │                   │                        │
         └───────────────────┼────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE BACKEND                             │
├─────────────────────────────────────────────────────────────────────┤
│  • PostgreSQL Database (with Row Level Security)                    │
│  • Supabase Auth (authentication & session management)              │
│  • Edge Functions (Deno/TypeScript serverless functions)            │
│  • Supabase Storage (images, photos)                                │
│  • Realtime Subscriptions (live updates)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| profiles | Base user information (email, name, role, phone) |
| registration_requests | Pending user registrations awaiting approval |
| client_profiles | Client-specific data (goals, assigned trainer/dietitian) |
| trainer_profiles | Trainer data (specializations, certifications, hourly rate) |
| dietitian_profiles | Dietitian data (license, experience, consultation fee) |
| subscriptions | Membership plans with status and PT sessions |
| bookings | PT session bookings with statuses |
| attendance | Gym check-in/check-out records |
| loyalty_tracking | Consecutive months and rewards earned |

### Nutrition Tables

| Table | Purpose |
|-------|---------|
| foods | Food database with nutrition information (110+ items) |
| diet_plans | Diet plans with daily macro targets |
| diet_plan_meals | Scheduled meals within diet plans |
| diet_plan_meal_items | Individual food items in meals |
| meal_logs | Client meal tracking entries |
| body_compositions | InBody-style body composition data |
| client_dietitian_assignments | Links clients to dietitians |

### Workout Tables

| Table | Purpose |
|-------|---------|
| exercises | Exercise library (70+ exercises) |
| workout_logs | Session workout records with exercises performed |
| availability | Trainer availability slots |

---

## Edge Functions (Serverless API)

| Function | Purpose |
|----------|---------|
| register | Handle new user registration |
| login | Authenticate users with approval check |
| approve-registration | Admin approves/rejects pending registrations |
| admin-action | Admin-specific operations |
| dietitian-action | Dietitian-specific operations |
| body-composition | Body composition CRUD operations |
| diet-plan | Diet plan management |
| meal-log | Client meal logging |

---

## Project Structure

```
sweatboxgym/
├── mobile/                    # Flutter mobile application
│   ├── lib/
│   │   ├── core/             # Config, router, theme
│   │   ├── features/         # Feature modules (auth, client, trainer, etc.)
│   │   └── models/           # Data models
│   └── pubspec.yaml          # Flutter dependencies
│
├── admin/                     # Admin Next.js dashboard
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   └── lib/                  # Utilities & Supabase client
│
├── dietitian/                # Dietitian Next.js dashboard
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   └── lib/                  # Utilities & Supabase client
│
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge Functions
│   ├── COMPLETE_FRESH_SETUP.sql  # Full database setup
│   └── SEED_FOODS.sql        # Food database seed
│
└── docs/                     # Documentation
```

---

## Security Model

1. **Row Level Security (RLS)**: Every table has RLS policies ensuring users can only access data they're authorized to see

2. **Role-Based Access Control**: Admins have full access; trainers/dietitians see assigned clients; clients see only their own data

3. **Edge Functions**: Sensitive operations (auth, approvals) handled by secure serverless functions

4. **Password Hashing**: All passwords are hashed before storage

5. **Registration Approval**: New users must be approved by admin before accessing the system

---

## Subscription Plans

| Plan | Monthly Price | Includes |
|------|---------------|----------|
| Open Gym | $75/month | Gym access only |
| With PT | $200/month | Gym access + Personal training sessions |

### Loyalty Rewards Program
- **12 consecutive months**: 1 free PT month
- **24 consecutive months**: 1 free PT month
- **36 consecutive months**: 1 free PT month

---

## Current Status & Limitations

### Implemented Features
- Complete multi-app architecture
- User authentication with approval workflow
- Body composition tracking (InBody-style)
- Diet plan management
- Meal logging
- Session booking
- Attendance tracking
- Loyalty rewards system
- Subscription management
- Exercise library

### Not Yet Implemented

| Feature | Status |
|---------|--------|
| Payment Gateway Integration | Manual recording only (no Stripe/PayPal) |
| Email Service | Notifications stored in DB only (no SMTP/SendGrid) |
| Push Notifications | Tokens stored but not implemented |
| Third-party Integrations | No fitness trackers, no social media |

---

## Getting Started

### Prerequisites
- Flutter SDK 3.16+
- Node.js 18+
- Supabase account

### Quick Start Commands

**Admin Dashboard:**
```
cd admin
npm install
npm run dev
```
Opens at: http://localhost:3000

**Dietitian Dashboard:**
```
cd dietitian
npm install
npm run dev
```
Opens at: http://localhost:3002

**Mobile App:**
```
cd mobile
flutter pub get
flutter run -d chrome
```

### Database Setup
1. Run `COMPLETE_FRESH_SETUP.sql` in Supabase SQL Editor
2. Run `SEED_FOODS.sql` to populate food database
3. Create admin/dietitian accounts via SQL

---

## User Roles Summary

| Role | Access | Primary Interface |
|------|--------|-------------------|
| **Client** | Own data, bookings, diet plans, meal logs | Mobile App |
| **Trainer** | Own schedule, assigned clients, workouts | Mobile App |
| **Dietitian** | Assigned clients, diet plans, body compositions | Dietitian Dashboard |
| **Admin** | Full system access, user management, approvals | Admin Dashboard |

---

## Summary

SweatBox Gym is a full-featured fitness management platform with:

- **3 applications**: Mobile (Flutter), Admin Dashboard (Next.js), Dietitian Dashboard (Next.js)
- **4 user roles**: Client, Trainer, Dietitian, Admin
- **Robust backend**: Supabase with PostgreSQL, Edge Functions, and RLS security
- **Complete nutrition system**: Diet plans, food database, meal tracking, body composition
- **Gym operations**: Bookings, attendance, subscriptions, loyalty rewards

The system is designed to streamline gym operations by providing role-specific interfaces for all stakeholders while maintaining strong security through database-level access controls.

---

*Report Generated: February 2026*
*SweatBox Gym - Sarba, Jounieh, Lebanon*
