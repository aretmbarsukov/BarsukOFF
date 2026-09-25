# BarsukON

## MVP Supabase setup

1. Create/open a Supabase project and run `supabase-schema.sql` in **SQL Editor**.
2. Create a user with the site auth form. Assign an administrator manually in SQL Editor using the example in the schema; do not expose service-role keys.
3. `index.html` must contain the public `anon`/publishable key from the same Supabase project. Never paste a secret/service-role key.
4. Deploy `index.html` and this schema on any static host (GitHub Pages, Netlify, or Vercel).
5. Add promotions and approved reviews from the Supabase dashboard. Public visitors can read active promotions and approved reviews; signed-in users can create requests and see their own data.

The SQL is intentionally not run by the static site. Never commit a secret key.