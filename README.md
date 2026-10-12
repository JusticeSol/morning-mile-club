# Morning Mile Club

Club website for the Saturday run. Next.js 16 (App Router, Cache Components) + Supabase.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (or anon) key.
3. In Supabase → Authentication:
   - **URL Configuration:** set the Site URL and add `http://localhost:3000/auth/callback`
     (plus your Vercel domain's `/auth/callback`) to the redirect URLs.
   - **Email template (Magic Link):** include `{{ .Token }}` so members get a 6-digit code
     they can type in. It works even when the email opens in a different browser.
   - **Phone login:** enable the Phone provider and connect an SMS provider (e.g. Twilio).
     Until then, use email.
4. `npm install` then `npm run dev`.

Make yourself an admin after signing up once:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

## Testing QR check-in

Create a run and get its check-in link (the admin screen will do this later):

```sql
insert into runs (run_date, title) values (current_date, 'Test run') returning id;
select code from run_checkin_codes where run_id = '<id>';
```

Open `/checkin/<id>?code=<code>`. Check-in is only open 06:00–08:45 Lagos time on the run
date. To test outside that window, widen it:

```sql
update runs set checkin_opens_at = now() - interval '1 hour',
                checkin_closes_at = now() + interval '1 hour' where id = '<id>';
```
