# Client Nutrition – Testing Guide

End-to-end testing for Client Nutrition across Admin, Dietitian, and Flutter.

---

## Prerequisites

1. **mm** (m@gmail.com) or any test client with **Nutrition Plan** or **Premium Package**
2. **Dietitian** user (e.g. dietitian@sweatboxgym.com) in Supabase
3. `.env.local` configured for Admin and Dietitian

---

## 1. Plan visibility rules

| Plan            | Admin Client Nutrition | Dietitian portal  | Flutter (client)                     |
|----------------|------------------------|-------------------|---------------------------------------|
| Nutrition Plan | ✓                      | ✓ (if assigned)   | Diet Plans, Meal Log, Body Composition, Progress, Profile. **No Sessions (PT)** |
| Premium        | ✓                      | ✓ (if assigned)   | All tabs including **Sessions (PT)**  |
| Normal Gym     | ✗                      | ✗                 | No nutrition features                 |
| With PT        | ✗                      | ✗                 | PT only, no nutrition                 |

---

## 2. Test Admin – Client Nutrition

1. Start admin: `cd admin && npm run dev`
2. Log in as admin
3. Go to **Client Nutrition & Body Data**
4. **Client list**
   - Only clients with **Nutrition Plan** or **Premium Package** appear
   - If empty: set mm’s subscription (see below)

5. **Update mm’s subscription** (Supabase SQL or Admin → Subscriptions):

```sql
UPDATE subscriptions
SET subscription_type = 'with_dietitian'
WHERE client_id = '5d248959-9c5f-454e-8704-8ec5c935255d' AND status = 'active';
```

6. Select a client and check tabs:
   - Body Composition
   - Diet Plans
   - Commitment Tracking
   - Meal Logs

---

## 3. Test Admin – Add member with dietitian assignment

1. Go to **Members** → **Add Member**
2. Choose **Nutrition Plan** or **Premium Package**
3. **Assign to Dietitian** appears – select a dietitian
4. Add member
5. In Supabase, confirm:
   - `client_dietitian_assignments` row with that client and dietitian
   - `subscriptions.subscription_type` is `with_dietitian` or `premium`

---

## 4. Test Dietitian portal

1. Start: `cd dietitian && npm run dev`
2. Log in as dietitian (same email/password as in Supabase)
3. Go to **My Clients**
4. **Expected**
   - Only assigned clients with **Nutrition Plan** or **Premium Package**
   - Same glassy layout and video background as admin
   - LA Fitness video in the background

5. Click a client:
   - Body Analysis
   - Diet Plans
   - Create/edit diet plans for that client

---

## 5. Test Flutter – client

1. Run Flutter: `cd mobile && flutter run`
2. Log in as mm (or client with Nutrition Plan)
3. **Expected**
   - Bottom nav: Home, Progress, Profile (no Sessions tab)
4. Log in as client with **Premium**
5. **Expected**
   - Bottom nav: Home, Sessions, Progress, Profile (Sessions visible)
6. **Video and layout**
   - LA Fitness video background
   - Glassy overlay and content

---

## 6. Video check (Admin, Dietitian, Flutter)

- **Admin:** `admin/public/videos/gym.mp4` – LA Fitness
- **Dietitian:** `dietitian/public/videos/gym.mp4` – same video
- **Flutter:** `mobile/assets/videos/gym.mp4` – same video

Verify video plays in all three apps.

---

## 7. Migration status

```powershell
cd c:\Users\Lenovo\Desktop\gymapplication-main
npx supabase migration list
```

Ensure `20250226000000_dietitian_subscription_access` is applied (subscriptions_select_dietitian for dietitians).

---

## 8. Troubleshooting

### No clients in Admin Client Nutrition

- Client must have active subscription with `subscription_type` `with_dietitian` or `premium`
- Run the SQL above for mm or fix via Admin → Subscriptions

### No clients in Dietitian portal

- Client must be assigned via `client_dietitian_assignments`
- Client must have Nutrition Plan or Premium subscription
- When adding a member with Nutrition/Premium, choose a dietitian in the Add Member form

### Sessions tab missing in Flutter

- By design for **Nutrition Plan** clients (no PT)
- Premium clients see Sessions tab
