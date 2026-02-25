# SweatBox Gym - End-to-End Testing Workflow

Use this workflow to verify Admin, Flutter (client + coach), and Dietitian platforms work correctly together. Test client: **mm** (m@gmail.com).

**Client Nutrition visibility:** Only clients with **Nutrition Plan** ($300/mo, `with_dietitian`) or **Premium Package** ($550/mo, `premium`) appear in the Client Nutrition page. Other plans are excluded.

---

## 1. Environment Setup

### Admin (`admin/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://jucjlxepcfhhlzieovmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # Required for API routes
```

### Dietitian (`dietitian/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://jucjlxepcfhhlzieovmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Flutter (`mobile/`)
- Supabase is configured in `main.dart` – ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` match admin/dietitian.
- Check `lib/main.dart` for Supabase initialization.

---

## 2. Push Supabase Migrations

```powershell
cd c:\Users\Lenovo\Desktop\gymapplication-main
npx supabase db push
```

Verify:
```powershell
npx supabase migration list
```
All migrations should show as applied (including `20250225000000_fix_client_roles`).

---

## 3. Test Admin - Client Nutrition

1. **Start admin**
   ```powershell
   cd admin
   npm run dev
   ```

2. **Log in** as admin (admin@gmail.com).

3. **Go to Client Nutrition** (sidebar → Client Nutrition & Body Data).

4. **Check client list**
   - Client **mm** (m@gmail.com) should appear.
   - If not: run the fix migration or check Supabase that mm has a `profiles` row with `role='client'` (or a `client_profiles` row).

5. **Select mm** and verify all tabs:
   - Body Composition
   - Diet Plans
   - Commitment Tracking
   - Meal Logs

---

## 4. Test Flutter - Client (mm)

1. **Run Flutter app**
   ```powershell
   cd mobile
   flutter pub get
   flutter run
   ```

2. **Log in** as mm (m@gmail.com).

3. **Verify screens**
   - Home: gym video background + glassy content.
   - Profile: no RangeError; initials display correctly.
   - Progress: body metrics and charts.
   - Diet Plans: if a plan exists, it loads.
   - Meal Log: log a meal and confirm it saves.

---

## 5. Test Flutter - Coach (Trainer)

1. **Log in** as trainer (e.g. s@gmail.com or coach account).

2. **Verify**
   - Same gym video + glassy layout.
   - Client list loads.
   - Can view client details.

---

## 6. Test Dietitian Platform

1. **Start dietitian**
   ```powershell
   cd dietitian
   npm run dev
   ```

2. **Log in** as dietitian@sweatboxgym.com.

3. **Assign dietitian to mm (if needed)** in admin.

4. **Create a diet plan for mm** in dietitian app.

5. **Check admin** – open Client Nutrition for mm → Diet Plans tab should show the new plan.

6. **Check Flutter** – mm logs in → Diet Plans should show the plan.

---

## 7. Quick Checks

| Platform   | Test                                   | Expected                             |
|-----------|----------------------------------------|--------------------------------------|
| Admin     | Client list                            | mm appears                            |
| Admin     | mm nutrition tabs                      | No "Failed to fetch"                  |
| Flutter   | mm Profile tab                         | No RangeError                         |
| Flutter   | Background                              | gym.mp4 + glassy overlay               |
| Dietitian | Create plan for mm                     | Plan appears in admin + Flutter       |

---

## 8. Troubleshooting

### "No clients found" in admin (Client Nutrition)
- Only **Nutrition Plan** (`with_dietitian`) and **Premium Package** (`premium`) subscribers appear.
- Ensure mm has one of these plans. Run in Supabase SQL Editor:
  ```sql
  UPDATE subscriptions
  SET subscription_type = 'with_dietitian'
  WHERE client_id = '5d248959-9c5f-454e-8704-8ec5c935255d' AND status = 'active';
  ```
- Or update via Admin → Subscriptions.

### RangeError on Profile tab
- Ensure `mobile` is up to date with the `user_model.dart` initials fix.
- Run `flutter clean && flutter pub get && flutter run`.

### Video not showing in Flutter
- Confirm `assets/videos/gym.mp4` exists.
- Check `pubspec.yaml` includes `assets/videos/`.
