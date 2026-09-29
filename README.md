# BarsukON

## MVP Supabase setup

1. Create/open a Supabase project and run `supabase-schema.sql` in **SQL Editor**.
2. Create a user with the site auth form. Assign an administrator manually in SQL Editor using the example in the schema; do not expose service-role keys.
3. `index.html` must contain the public `anon`/publishable key from the same Supabase project. Never paste a secret/service-role key.
4. Deploy `index.html` and this schema on any static host (GitHub Pages, Netlify, or Vercel).
5. Add promotions and approved reviews from the Supabase dashboard. Public visitors can read active promotions and approved reviews; signed-in users can create requests and see their own data.

The SQL is intentionally not run by the static site. Never commit a secret key.

### Administrator

Create the administrator account through the site's **Acceder → Crear cuenta** form. Then copy that user's UUID from **Authentication → Users** and run this in Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'AUTH-USER-UUID';
```

After signing in again, the account will show the admin panel with repair requests, review moderation, and promotion creation, activation, and deletion. Never put an account password in the frontend or repository; if a password was shared in chat, change it before using the account.

If the schema was already executed before review deletion was added, run this small migration once in Supabase SQL Editor:

```sql
drop policy if exists "reviews admin delete" on public.reviews;
create policy "reviews admin delete"
on public.reviews for delete to authenticated
using (public.is_admin());
```

### Public repair requests

For signed-in and guest repair requests to appear in the admin dashboard, run `supabase-request-intake-migration.sql` once in Supabase SQL Editor. It allows anonymous visitors to submit requests only; they cannot read or modify requests. An administrator can review each request, change its status, reject it, or delete it from the account panel.

### Account dashboard and mobile repair

The signed-in account dashboard has separate tabs for orders, starting a studio repair, mobile service, support, and account settings. Studio orders come from `public.repair_requests`; mobile orders come from `public.mobile_repairs`. The dashboard shows a short order reference, status, date, price, and a details view, with active/archive/cancelled filters.

After `supabase-schema.sql`, run `supabase-mobile-service-migration.sql` in Supabase SQL Editor to create the mobile-repair, technician-schedule, and mobile-hours tables and the secure booking/rescheduling functions. The public page now has a visible mobile-repair section and a booking form for signed-in users: it loads available slots, prices by brand and repair type, adds the €15 travel fee, and records a request without taking payment. Customers can see their own mobile requests; admins can create or remove available slots, update request statuses, and reschedule visits from the moderation panel. The migration exposes only available time slots to customers, reserves schedule management for admins, and restricts profile edits to contact fields so users cannot promote themselves to admin.

The schedule starts empty; an admin must add bookable time slots in the moderation panel before customers can request a visit. Requests are limited to dates 3–7 days ahead, and the booking function atomically reserves a slot to prevent double-booking. All requests remain pending until the business confirms them. Maps, SMS notifications, and payment processing are not included, and no real payments are collected. Do not enter Google Maps, SMS-provider, or Supabase service-role secrets in `index.html`.