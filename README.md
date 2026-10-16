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

## Database updates

`supabase/schema.sql` is always the full, current schema (use it for a fresh project).
If your database was set up from an older version, run the files in `supabase/migrations/`
that are newer than your setup, in date order, in the Supabase SQL Editor. Each is safe to re-run.

## Run day (admins)

1. **Admin → New run** (defaults to the coming Saturday, 12 km). Each run gets its own QR code.
2. At the meetup, open the run and tap **Show QR code**. Members scan it with their phone camera
   and tap "I'm here". The screen stays awake and the count updates every 10 seconds.
3. **Tick-off list:** tap anyone who can't scan (dead phone, no data). QR scans show up there too.
4. Runs complete automatically once check-in closes (8:20), which awards streaks and badges.
   **Mark completed** does it early. Rained off? **Cancel run**; it won't break anyone's streak.
5. **WhatsApp reminder & recap** (on the run page): ready-made messages to edit, copy or share.
6. **Forgot to log km?** Members log 8:20–10:45. After that, an admin taps the km box next to the
   member on the tick-off list to add or fix it, any time.

Members log km from the home page or the check-in screen, but only for a run they're checked
in to (scanned or ticked).

Set `NEXT_PUBLIC_SITE_URL` in production so the QR code points at the live site.

## Testing check-in outside Saturday morning

Check-in is only open 06:00–08:20 Lagos time on the run date; km logging 08:20–10:45. To test at another time, widen it:

```sql
update runs set checkin_opens_at = now() - interval '1 hour',
                checkin_closes_at = now() + interval '1 hour' where id = '<id>';
```
