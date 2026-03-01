# Subscription & Payment Testing Guide

## Overview

This guide covers how to test:
- Admin subscriptions (design, renew button visibility, payment recording)
- Client mobile app (days remaining, renewal notification, home dashboard)
- Secure payment tracking (cash, card, bank transfer, other)

---

## 1. Push the migration

```powershell
cd c:\Users\Lenovo\Desktop\gymapplication-main
npx supabase db push
```

This creates the `subscription_payments` table and `payment_method_type` enum.

---

## 2. Admin dashboard – design & renew button

### Start the admin app

```powershell
cd admin
npm run dev
```

Open http://localhost:3002 (or port shown in terminal).

### Design consistency

- Go to **Dashboard** → note the glass-card header with blur, gradient overlays.
- Go to **Subscriptions** → the header should match (glass-card, same style).
- Subscription cards should have `border border-white/10` like members/trainers.

### Renew button visibility (last 5 days only)

1. Log in as admin.
2. Go to **Subscriptions**.
3. Add or edit a subscription so its `end_date` is 3–5 days from today.
4. Confirm: the **Renew +1 month** button appears only when **days remaining ≤ 5**.
5. Change `end_date` to 10 days from today → **Renew** should disappear.
6. Change `end_date` to 2 days from today → **Renew** should appear again.

---

## 3. Admin – renewal with payment method

When **Renew** is visible (last 5 days):

1. Click **Renew +1 month**.
2. Modal should show:
   - Client name
   - Plan name
   - Amount (from `price_usd` or plan config)
   - Payment method: **Cash**, **Card**, **Bank Transfer**, **Other**
3. Choose a method and click **Confirm renewal**.
4. In Supabase:
   - Subscription `end_date` extended by 1 month.
   - New row in `subscription_payments` (amount, method, `subscription_id`).
5. Confirm no card numbers are stored; only `payment_method` and `amount_usd`.

---

## 4. Mobile app – client subscription awareness

### Start the Flutter app

```powershell
cd mobile
flutter run
```

### Home screen – days remaining card

1. Log in as a **client** with an active subscription.
2. On the home screen, find the **Subscription days** card:
   - Plan name
   - “X days left”
   - Green when > 5 days, amber when ≤ 5.
3. If the client has no subscription, the card should not appear.

### Profile screen – days remaining

1. Go to **Profile** tab.
2. Subscription card should show:
   - Plan name
   - Days remaining (large)
   - Renewal date
   - Progress bar

---

## 5. Mobile – renewal notification (last 5 days)

1. Use a subscription whose `end_date` is within 5 days.
2. Open the app and go to **Profile**.
3. A dialog should appear: “Subscription expiring soon”
   - Shows days left
   - Renewal amount (from `price_usd`)
   - CTA to visit the gym to renew with cash, card, etc.
4. Tap **Got it** or **I'll renew** to close.
5. Re-open Profile → the dialog should not appear again in the same session.

---

## 6. Security checks

### RLS

1. Open Supabase Dashboard → Authentication → SQL Editor.
2. Run (replace `CLIENT_USER_ID` with a real client UUID):

```sql
-- As client: can read own subscription
SET request.jwt.claims = '{"sub": "CLIENT_USER_ID"}';
SELECT * FROM subscriptions WHERE client_id = 'CLIENT_USER_ID';
-- Should return rows

-- As client: cannot read other clients
SELECT * FROM subscriptions WHERE client_id != 'CLIENT_USER_ID';
-- Should return no rows (RLS blocks)
```

3. For `subscription_payments`:
   - Admins: full access.
   - Clients: can only read payments for their own subscriptions.

### No sensitive payment data

- Only `payment_method` (cash, card, bank_transfer, other) is stored.
- No card numbers, CVV, or account details.
- Payment is processed at the gym desk; app records the method and amount.

---

## 7. End-to-end flow

1. **Admin**: Add member → create subscription (e.g. PT Package, $350, end_date = 4 days from now).
2. **Admin**: Go to Subscriptions → Renew button visible.
3. **Admin**: Click Renew → select “Card” → Confirm.
4. **Client**: Open mobile app → Home shows “4 days left” (or similar).
5. **Client**: Go to Profile → renewal dialog with price.
6. **Admin**: Check Supabase `subscription_payments` → new row with amount and method.
7. **Admin**: After renewal, subscription `end_date` is extended; Renew button hides until last 5 days again.

---

## Troubleshooting

| Issue | Check |
|------|--------|
| Renew button always visible | `end_date` must be within 5 days of today |
| Renew button never visible | Subscription status must be `active` and days ≤ 5 |
| Client doesn’t see subscription | RLS: `subscriptions_select_own`; client must be logged in |
| Migration fails | Ensure `is_admin()` exists (base schema) |
| Price shows $0 | Set `price_usd` when creating the subscription |
