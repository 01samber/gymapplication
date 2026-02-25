# Platform Relations Test Flow

Use this flow to verify that nutritionists, clients, and assignments stay in sync across Admin, Dietitian, and Flutter app.

---

## Prerequisites
- Admin running: `cd admin && npm run dev`
- Dietitian running: `cd dietitian && npm run dev -p 3002`
- Supabase project connected (`.env.local` in admin and dietitian)
- Run migrations: `npx supabase db push`

---

## Test 1: Nutritionist Auto-Update (Admin → All Platforms)

1. **Open Admin** → Dashboard → Nutritionists
2. Click **Add Nutritionist**
3. Fill: Name, Email, Phone, Date of Birth, Specializations
4. Submit → note the temp password
5. **Verify Admin**: New nutritionist appears in the list immediately (realtime)
6. **Verify Dietitian dropdown**: Go to Members → Add Member → select Nutrition Plan or Premium
   - The new nutritionist should appear in the "Assign to Dietitian" dropdown
7. **Verify Dietitian login**: Open dietitian app (port 3002), sign in with the new nutritionist’s email + temp password
   - **First login**: Redirects to Set Password page (same as client)
- Set new password → lands on dietitian dashboard

**Expected**: Nutritionist is visible in Admin, in the Add Member dropdown, and can log in with forced password change.

---

## Test 2: Assign Client to Trainer/Nutritionist (Admin)

1. In Admin → Members → **Add Member**
2. Enter: Name, Email, Phone, DOB
3. **For PT Package (with_pt) or Premium**: Select plan → "Assign to Trainer" dropdown appears → choose trainer
4. **For Nutrition Plan (with_dietitian) or Premium**: Select plan → "Assign to Dietitian" dropdown appears → choose dietitian
5. **For Premium**: Both Trainer and Dietitian dropdowns appear
6. Submit
7. **Verify Admin Members**: New member card shows "Trainer: [Name]" and/or "Dietitian: [Name]"
8. **Verify Admin Client Nutrition**: Go to Client Nutrition → the new client appears (for Nutrition/Premium)
9. **Verify Dietitian portal**: In dietitian app → My Clients (for Nutrition/Premium)
   - New client should appear immediately (realtime) or after refresh

**Expected**: Client appears in Admin Members with dietitian, in Client Nutrition, and in Dietitian’s client list.

---

## Test 3: Dietitian Adds Client (Not in Gym)

1. Log in to **Dietitian portal** as a dietitian
2. Go to **My Clients**
3. Click **Add New Client**
4. Fill: Name, Email, Phone, Date of Birth
5. Submit → note the temp password
6. **Verify Dietitian**: New client appears in the list
7. **Verify Flutter**: Client can log in to the Flutter app with the temp password
8. **Verify Admin**: Client does **not** appear in Admin Members (no gym subscription)
9. **Verify Admin Client Nutrition**: Client does **not** appear in Client Nutrition (Nutrition/Premium only)

**Expected**: Dietitian-added clients only appear in Dietitian portal and can use the Flutter app; they do not appear in Admin Member list or Client Nutrition.

---

## Test 4: Trainer/Nutritionist Auto-Update When Added

1. Open Admin → **Members** → Click **Add Member** (keep modal open or note the dropdown state)
2. In another tab → **Nutritionists** → Add a new nutritionist
3. Switch back to Members tab → **Verify**: The new nutritionist appears in "Assign to Dietitian" dropdown (refetch on window focus)
4. Similarly: **Trainers** → Add trainer → Members → Add Member → "Assign to Trainer" shows new trainer

**Expected**: Newly added trainers and nutritionists appear in Add Member dropdowns without page refresh (realtime + focus refetch).

---

## Test 5: Realtime Sync (Multi-Tab)

1. Open **Admin Nutritionists** in Tab A
2. Open **Admin Nutritionists** in Tab B (or Dietitian My Clients in Tab B)
3. In Tab A: Add a new nutritionist
4. **Verify Tab B**: List updates without manual refresh

**Expected**: Realtime updates keep both tabs in sync.

---

## Test 6: Flutter App – Client Login & Nutrition Features

1. Log in as a client with **Nutrition Plan** or **Premium**
2. **Verify**: Diet Plans, Meal Log, Body Composition are accessible
3. Log in as a client with **Normal Gym**
4. **Verify**: Diet Plans and nutrition features are limited or not shown (per app logic)

---

## Database Relations (Reference)

```
profiles (role='dietitian')
  └── dietitian_profiles (user_id)
        └── client_dietitian_assignments (dietitian_id)

profiles (role='client')
  └── client_profiles (user_id, assigned_dietitian_id)
  └── subscriptions (client_id, subscription_type IN ('with_dietitian','premium'))

client_dietitian_assignments (client_id, dietitian_id, is_active)
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Nutritionist not in Add Member dropdown | Ensure `profiles.role='dietitian'` and `dietitian_profiles` row exists. Refetch dietitians (close/reopen modal). |
| Client not in Dietitian's list | Check `client_dietitian_assignments` has row with `dietitian_id` and `is_active=true`. |
| Realtime not updating | Confirm Supabase project has Realtime enabled. Check browser console for subscription errors. |
| Dietitian can't add client | Ensure `SUPABASE_SERVICE_ROLE_KEY` is in dietitian `.env.local`. |
