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

## Run day (admins)

1. **Admin → New run** (defaults to the coming Saturday, 12 km). Each run gets its own QR code.
2. At the meetup, open the run and tap **Show QR code**. Members scan it with their phone camera
   and tap "I'm here". The screen stays awake and the count updates every 10 seconds.
3. **Tick-off list:** tap anyone who can't scan (dead phone, no data). QR scans show up there too.
4. After the run, tap **Mark completed**. Streaks and badges only count completed runs, so this
   is what awards them. Rained off? **Cancel run**; it won't break anyone's streak.

Members log km from the home page or the check-in screen, but only for a run they're checked
in to (scanned or ticked).

Set `NEXT_PUBLIC_SITE_URL` in production so the QR code points at the live site.

## Testing check-in outside Saturday morning

Check-in is only open 06:00–08:45 Lagos time on the run date. To test at another time, widen it:

```sql
update runs set checkin_opens_at = now() - interval '1 hour',
                checkin_closes_at = now() + interval '1 hour' where id = '<id>';
```
