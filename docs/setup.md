# SweatBox Gym - Setup Guide

Complete guide to get the SweatBox Gym platform running on your machine.

## Prerequisites

### Required Software

1. **Flutter SDK** (3.16 or higher)
   - Download: https://flutter.dev/docs/get-started/install
   - Verify: `flutter --version`

2. **Node.js** (18.x or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

### Optional (for mobile deployment)

4. **Android Studio** (for Android development)
   - Download: https://developer.android.com/studio
   - Install Android SDK and emulator

5. **Xcode** (for iOS development, macOS only)
   - Download from Mac App Store
   - Install iOS Simulator

---

## Step 1: Supabase Setup (Backend)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Fill in:
   - **Name**: SweatBox Gym
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to Lebanon (e.g., Frankfurt)
4. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Migrations

1. Go to **SQL Editor** in Supabase dashboard
2. Run migrations in order:
   - First: Copy and run `supabase/COMPLETE_SETUP_V2.sql` (full schema)
   - Then: Copy and run `supabase/SCHEMA_FIXES.sql` (compatibility fixes for mobile/admin)
3. Verify tables created in **Table Editor**

### 1.3 Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key (safe for client-side)

### 1.4 Configure Storage (for photos)

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `avatars` (public)
   - `progress-photos` (private)
3. Set policies:

```sql
-- Avatars bucket: Anyone can view, authenticated users can upload their own
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Progress photos: Only owner and trainer can view
CREATE POLICY "Users can view their own progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Step 2: Mobile App Setup (Flutter)

### 2.1 Install Dependencies

```bash
cd mobile
flutter pub get
```

### 2.2 Configure Environment

Create `mobile/.env` file:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Or use dart-define when running:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

### 2.3 Run the App

```bash
# Check connected devices
flutter devices

# Run on specific device
flutter run -d chrome          # Web browser
flutter run -d android         # Android emulator/device
flutter run -d ios             # iOS simulator/device
```

### 2.4 Build for Production

```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS (requires macOS + Xcode)
flutter build ios --release
```

---

## Step 3: Admin Dashboard Setup (Next.js)

### 3.1 Install Dependencies

```bash
cd admin
npm install
```

### 3.2 Configure Environment

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.3 Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 3.4 Build for Production

```bash
npm run build
npm start
```

---

## Step 4: Create Admin User

### 4.1 Sign Up via Supabase Auth

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User** → **Create New User**
3. Enter email and password for admin
4. After creation, note the user's UUID

### 4.2 Set Admin Role

Run in SQL Editor:

```sql
-- Replace USER_UUID with the actual user ID
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_UUID';
```

---

## Step 5: Create Test Data (Optional)

Run this in Supabase SQL Editor:

```sql
-- Create a test trainer
INSERT INTO profiles (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'trainer@sweatbox.gym', 'Ahmad Khalil', 'trainer');

INSERT INTO trainer_profiles (user_id, specializations, bio, experience_years, hourly_rate)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  ARRAY['strength', 'conditioning', 'weight_loss'],
  'Certified personal trainer with 5+ years experience',
  5,
  30.00
);

-- Create a test client
INSERT INTO profiles (id, email, full_name, role) VALUES
('22222222-2222-2222-2222-222222222222', 'client@test.com', 'John Smith', 'client');

INSERT INTO client_profiles (user_id, goal, fitness_level)
VALUES ('22222222-2222-2222-2222-222222222222', 'weight_loss', 5);

-- Create a subscription
INSERT INTO subscriptions (client_id, type, status, price_usd, start_date, end_date, pt_sessions_included)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'with_pt',
  'active',
  200.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  12
);
```

---

## Deployment

### Mobile Apps

**Android (Google Play)**
1. Create developer account ($25 one-time)
2. Generate signing key
3. Upload AAB from `flutter build appbundle`

**iOS (App Store)**
1. Create Apple Developer account ($99/year)
2. Configure Xcode signing
3. Upload via Xcode or Transporter

### Admin Dashboard

**Vercel (Recommended - Free)**
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

**Other Options**
- Netlify
- Railway
- Self-hosted (Docker)

---

## Troubleshooting

### Flutter Issues

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Check for issues
flutter doctor -v
```

### Supabase Connection Issues

1. Check URL and key are correct
2. Verify RLS policies allow your operations
3. Check browser console for errors

### CORS Issues (Web)

Add your domain to Supabase:
Settings → API → CORS → Add your domain

---

## Support

For issues specific to this project:
1. Check existing GitHub issues
2. Create new issue with error details
3. Include: platform, Flutter version, steps to reproduce
