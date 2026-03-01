# SweatBox Mobile App — Testing Guide

Use this guide to test the Flutter app (Client & Trainer) with the **Black / Yellow / Green** design.

---

## Prerequisites

1. **Flutter SDK** installed (`flutter --version`)
2. **Android Studio / Xcode** for device/simulator
3. **Supabase** running (local or hosted) with migrations applied
4. **Environment** — Copy `env.example` to `.env` and fill in Supabase URL + anon key

---

## 1. Run the App

```bash
# From project root
cd mobile

# Get dependencies
flutter pub get

# Run on connected device or emulator
flutter run
```

**Platform-specific:**
- **Android**: `flutter run` or open in Android Studio, select device
- **iOS** (Mac only): `flutter run` or `open ios/Runner.xcworkspace` in Xcode
- **Chrome (web)**: `flutter run -d chrome`

---

## 2. Test Flow (Full Journey)

### A. Splash & Login
| Step | Action | Expected |
|------|--------|----------|
| 1 | Launch app | Black splash with green icon box, "SWEAT BOX", yellow "GYM" |
| 2 | Wait for auth check | Redirects to Login or Home based on auth |
| 3 | Open Login | Black screen, green icon, yellow accents on inputs |
| 4 | Enter wrong password | Error SnackBar |
| 5 | Enter correct credentials | Navigate to Client or Trainer home |

### B. Client App
| Step | Action | Expected |
|------|--------|----------|
| 1 | View Home | Black background, green/yellow stat cards, IconBox on stats |
| 2 | Check bottom nav | Green FAB (center), green active tab |
| 3 | Tap Sessions (or FAB) | Bookings screen |
| 4 | Tap Progress | Progress screen |
| 5 | Tap Profile | Profile with black/yellow/green styling |

### C. Trainer App
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as trainer | Trainer home with black cards, green accents |
| 2 | Check Schedule | Today's sessions in dark cards |
| 3 | Check Clients | Client list with green borders |
| 4 | Tap Profile | Stats and menu in dark theme |

---

## 3. Design Checklist

| Element | Expected |
|---------|----------|
| **Background** | Black (#0A0A0B) |
| **Cards** | Dark gray (#1A1A1A) with green/yellow borders |
| **Primary actions** | Green gradient |
| **Accents** | Yellow (icons, highlights, stars) |
| **Icons** | IconBox (green gradient or yellow background) |
| **Text** | White primary, gray secondary |

---

## 4. Login Page Verification

- [ ] Black background
- [ ] Green gradient IconBox with fitness icon
- [ ] "Welcome Back" in white
- [ ] Email field: dark fill, yellow mail icon
- [ ] Password field: dark fill, yellow lock icon, yellow visibility toggle
- [ ] "Forgot Password?" in yellow
- [ ] Green "Sign In" button
- [ ] Yellow outlined "Create New Account" button

---

## 5. Quick Smoke Test (2 min)

1. `flutter run`
2. See splash → login
3. Login (or register)
4. Navigate: Home → Sessions → Progress → Profile
5. Confirm black/yellow/green throughout

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | `flutter clean && flutter pub get` |
| Supabase connection | Check `.env` and `EnvConfig` |
| No device | `flutter devices` to list; start emulator |
| Hot reload not working | Stop app, run again |

---

## 7. Test Credentials

Create a test user in Supabase (via Admin or SQL) and use those credentials for login. Ensure `profiles.role` is set to `client` or `trainer` for the correct home screen.
