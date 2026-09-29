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

After `supabase-schema.sql`, run these migrations in Supabase SQL Editor, in order:

1. `supabase-mobile-service-migration.sql`
2. `supabase-castellon-mobile-service-migration.sql`

The public booking form covers the 22 configured towns near Castellón, with coastal towns marked in the city list. Customers can select a date up to 14 days ahead, a live available slot, a device/repair type and part quality, and whether the visit is for themselves. Phone and saved address details are prefilled when available. Weekday hours are 10:00, 14:00, and 16:00; Saturday hours are 10:00 and 12:00; Sunday is closed. A database function enforces the active city, opening hours, closures, capacity, and one booking per slot atomically. The estimate applies the brand-specific repair price, the €15 OEM surcharge (when selected), and the €30 travel fee. Requests remain pending until an administrator confirms them; the site does not collect payment.

The admin panel can toggle weekly hours and covered towns, close a whole day, block a specific date/time, and update mobile request statuses. When a request is moved to `in_progress`, the admin panel attempts to send the customer an SMS via the Supabase Edge Function `mobile-repair-reminder`. To enable actual SMS, deploy it with `supabase functions deploy mobile-repair-reminder` and configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` as Edge Function secrets in Supabase; Supabase supplies the project URL and API keys to the function. Keep all secrets in Supabase only, never in `index.html` or Git. Without Twilio credentials and deployment, bookings still work but SMS delivery will report an error.