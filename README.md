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