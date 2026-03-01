# Admin Dashboard — Test Flow for Efficiency

Use this guide to systematically verify functionality and visual consistency across the admin dashboard.

---

## Prerequisites

1. **Start the admin app**: `cd admin && npm run dev`
2. **Supabase**: Ensure local or hosted Supabase is running and migrations applied
3. **Test credentials**: Have an admin login ready

---

## 1. Login Flow

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open `/` | Dark glass login page with video background |
| 1.2 | Enter wrong password | Login button drifts away from cursor |
| 1.3 | Enter correct credentials | Redirect to `/dashboard` |
| 1.4 | Refresh page (logged in) | Stay on dashboard |

---

## 2. Main Dashboard (`/dashboard`)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Load page | Hero with gradient overlays, blur circles |
| 2.2 | Check stats | Total Members, Active Trainers, Today's Bookings, Monthly Revenue cards visible |
| 2.3 | Check secondary stats | Today's Check-ins, Loyalty Rewards, Active Sessions |
| 2.4 | Check Recent Activity | List renders or empty state |
| 2.5 | Check Quick Actions | Links to Members, Bookings, Trainers, Reports work |
| 2.6 | Check Performance Overview | Metrics (Retention, Sessions, PT Utilization, Revenue) visible |

---

## 3. Subscriptions (`/dashboard/subscriptions`)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Load page | Hero with title, stats (Active, Expired, Frozen) |
| 3.2 | Search | Filter by client name |
| 3.3 | Filter by status | Dropdown filters list |
| 3.4 | Add subscription | Modal opens, form submits |
| 3.5 | Renew subscription | Renew flow works |
| 3.6 | Empty/loading | Glass-card states, Loader2 spin |

---

## 4. Members (`/dashboard/members`)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Load page | Hero, stats, member list |
| 4.2 | Search | Filters by name |
| 4.3 | Add member | Modal opens, submit works |
| 4.4 | Edit member | Edit modal works |
| 4.5 | Delete member | Confirmation and removal |

---

## 5. Trainers (`/dashboard/trainers`)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Load page | Hero, trainer list |
| 5.2 | Add trainer | Modal opens |
| 5.3 | Edit / deactivate | Actions work |
| 5.4 | Check specializations | Displayed correctly |

---

## 6. Nutritionists (`/dashboard/nutritionists`)

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Load page | Hero, nutritionist list |
| 6.2 | Add nutritionist | Modal works; dietitian gets temp password `SweatBoxWelcome1!` |
| 6.3 | Assign to client | Flow completes |

**Dietitian Portal Login:** Dietitians (and admins) sign in at http://localhost:3002. Ensure `dietitian/.env.local` has the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as admin.

---

## 7. Clients (`/dashboard/clients`)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Load page | Hero, client list with search |
| 7.2 | Click client | Nutrition tab / details panel |
| 7.3 | View body, diet, commitment, meal logs | Tabs switch |
| 7.4 | Empty states | Correct messaging |

---

## 8. Bookings (`/dashboard/bookings`)

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Load page | Hero, date picker, stats (Total, Confirmed, Pending) |
| 8.2 | Change date | Bookings update |
| 8.3 | Filter by status | Dropdown filters |
| 8.4 | Add booking | Modal opens and submits |
| 8.5 | Empty date | Empty state with CTA |
| 8.6 | Loading | Loader2 in glass-card |

---

## 9. Attendance (`/dashboard/attendance`)

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Load page | Hero, Daily View / Member Stats toggle |
| 9.2 | Daily view | Table shows check-ins for selected date |
| 9.3 | Member Stats | Cards with visits, last visit |
| 9.4 | Search | Filters members |
| 9.5 | Date navigation | Prev/next date updates data |
| 9.6 | Empty date | No check-ins message |

---

## 10. Exercises (`/dashboard/exercises`)

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Load page | Hero, exercise list |
| 10.2 | Search | Filters exercises |
| 10.3 | Add exercise | Modal works |
| 10.4 | Edit / delete | Actions work |
| 10.5 | Equipment view | Equipment cards visible |
| 10.6 | Text contrast | Headings text-white, readable |

---

## 11. Loyalty (`/dashboard/loyalty`)

**Rule:** 12 paid months of subscription = 13th month FREE. Tracked live from subscription renewals.

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | Load page | Hero, stats (Members, Free Months Earned, Pending), Sync from payments button |
| 11.2 | Sync from payments | Backfills loyalty_tracking from subscription_payments |
| 11.3 | Member Progress | Cards with progress bars (X/12 toward next reward) |
| 11.4 | Renew subscription | Go to Subscriptions, renew a client 12x (or use Sync) |
| 11.5 | Rewards History | List of earned rewards when client hits 12 months |
| 11.6 | Apply free month | Extends subscription by 1 month, marks reward claimed |
| 11.7 | Mark claimed | Alternative: mark as claimed without extending (manual) |
| 11.8 | Search | Filters members/rewards |
| 11.9 | Empty states | Clear messaging, Sync CTA |

---

## 12. Reports (`/dashboard/reports`)

| Step | Action | Expected |
|------|--------|----------|
| 12.1 | Load page | Hero, Export Report button |
| 12.2 | Business tab | Revenue, New Members, Sessions, Retention stats |
| 12.3 | Charts | Revenue and Members charts render |
| 12.4 | Nutrition tab | Diet plans, clients, completion rate stats |
| 12.5 | Plan types / meal types | Charts and bars render |
| 12.6 | Export Report | JSON download |
| 12.7 | Loading | Full-page loader |

---

## 13. Settings (`/dashboard/settings`)

| Step | Action | Expected |
|------|--------|----------|
| 13.1 | Load page | Hero, form sections |
| 13.2 | Edit Gym Info | Inputs accept changes |
| 13.3 | Edit Pricing | Numbers update |
| 13.4 | Edit Operating Hours | Time inputs work |
| 13.5 | Save | Success message, data persisted |

---

## 14. Visual Consistency Checklist

Use this to verify design consistency:

| Check | Where to verify |
|-------|-----------------|
| Hero layout: title + subtitle only (no large icon box) | All pages |
| Stats: `glass-subtle` rounded boxes with icons | Subscriptions, Bookings, Attendance, etc. |
| Filter bars: `glass-card` + `glass-input` | Subscriptions, Members, Clients, Bookings |
| Empty states: `text-white` headings, glass-button CTAs | All list pages |
| Loading: `Loader2` in glass-card | All pages with async data |
| Primary buttons: `glass-button` | Add, Save, Export, etc. |
| Table headers: `text-white` | Attendance |
| Cards: `glass-card` with `card-hover` | Lists and grids |

---

## 15. Performance Checks

| Metric | How to Check |
|--------|--------------|
| First load | Open DevTools Network; first dashboard load &lt; 3s |
| Navigation | Sidebar links change page with no flash |
| Search | Typing filters without noticeable lag |
| Modals | Open/close smooth, no layout shift |
| Tables | Scrolling smooth with 50+ rows |

---

## 16. Browser & Responsiveness

| Test | Expected |
|------|----------|
| Chrome/Edge | Full functionality |
| Firefox | Same behavior |
| Mobile viewport | Sidebar collapses, content readable |
| Dark mode | Colors consistent (primary green, accent red) |

---

## Quick Smoke Test (5 min)

1. Login  
2. Visit Dashboard, Subscriptions, Members, Bookings  
3. Run one search on each  
4. Open one modal (e.g. Add Member) and cancel  
5. Open Reports → switch tabs → Export  
6. Open Settings → change one field → Save  

If all pass, core flows are working.
