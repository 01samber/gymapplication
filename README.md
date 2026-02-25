# SweatBox Gym - Complete Fitness Management Platform

A professional gym management system connecting **Clients**, **Personal Trainers**, and **Administration**.

## 🎯 Core Features

### Phase 1: Scheduling & Booking (MVP)
- [ ] Client mobile app (iOS/Android)
- [ ] PT mobile app (iOS/Android)  
- [ ] Admin web dashboard
- [ ] Session booking & management
- [ ] Push notifications & reminders

### Phase 2: Body Tracking
- [ ] BMI, weight, body fat % logging
- [ ] Progress photos with comparison
- [ ] Trend charts & analytics

### Phase 3: Nutrition & Diet
- [ ] PT-assigned meal plans
- [ ] Client meal logging
- [ ] Macro tracking

### Phase 4: AI Predictions
- [ ] Progress predictions
- [ ] Goal tracking & forecasting
- [ ] Trainer performance analytics

---

## 🏗️ Project Structure

```
sweatboxgym/
├── mobile/                 # Flutter app (Client + PT)
│   ├── lib/
│   │   ├── core/          # Shared utilities, themes, constants
│   │   ├── features/      # Feature modules
│   │   ├── models/        # Data models
│   │   └── services/      # API, auth, storage services
│   └── ...
│
├── admin/                  # Next.js admin dashboard
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities & API clients
│
├── supabase/              # Database & backend
│   ├── migrations/        # SQL migrations
│   ├── functions/         # Edge functions (if needed)
│   └── seed.sql           # Sample data
│
└── docs/                  # Documentation
    ├── api.md             # API documentation
    ├── database.md        # Schema documentation
    └── setup.md           # Setup guide
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Mobile | Flutter 3.x | Single codebase for iOS + Android |
| Admin Web | Next.js 14 | Fast, modern React framework |
| Backend | Supabase | Auth + Database + Realtime + Storage |
| Database | PostgreSQL | Robust relational database |
| Styling | Tailwind CSS | Rapid UI development |

---

## 🚀 Quick Start

### Prerequisites
- Flutter SDK 3.16+
- Node.js 18+
- Supabase CLI (optional, for local dev)

### Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

### Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run migrations from `supabase/migrations/`
4. Copy credentials to environment files

---

## 📱 App Roles

### Client App
- View available PT sessions
- Book/cancel appointments
- Track body metrics
- View progress & predictions
- Access diet plans

### PT App
- Manage availability
- View client list & history
- Log session notes
- Assign diet plans
- Track client progress

### Admin Dashboard
- Manage all users (clients, PTs)
- View all bookings
- Revenue analytics
- Gym settings

---

## 🔐 Environment Variables

### Mobile (`mobile/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Admin (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License

Proprietary - SweatBox Gym

---

## 👤 Author

Built for Sweat Box Gym by Elias Boustany
Location: Sarba, Jounieh, Lebanon
