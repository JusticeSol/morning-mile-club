# Morning Mile Club — club website

Web app for the Morning Mile Club, a running club that runs every Saturday
(meet 6:30 AM, ~12–13 km, finish ~8:30). Built by Justice (GitHub: JusticeSol).

## Stack
- Next.js (App Router) + TypeScript, deployed on Vercel
- Supabase: Postgres, Auth (magic link / phone login so non-technical members can join), Storage for photos
- Dev machine: Windows, VS Code, PowerShell

## Product decisions (already made)
- The club coordinates on **WhatsApp**, so the site supports WhatsApp rather than replacing it: shareable links, a copy-paste weekly recap, and shareable image cards for WhatsApp status.
- Many members use **Strava** (Justice uses Oraimo). Strava's API terms (Nov 2024) only allow a user's Strava activity data to be shown **to that same user**, and they ban using it in AI models. So:
  - The club leaderboard, streaks and recap use ONLY data created on this site: QR check-ins and self-logged km.
  - Strava sync (optional) feeds a private "my runs" view only. Never show it to other members, and never send it to an AI model.
  - The club can use Strava's own club feature for a Strava-based km leaderboard.
- **Attendance via QR check-in** at the meetup. The QR links to `/checkin/<run_id>?code=<code>`. Codes live in an admin-only table, and the check-in window is 06:00–08:45 Lagos time.
- **Streaks** count consecutive *completed* Saturdays. Cancelled runs (rain, holidays) don't break a streak.

## MVP scope
1. Login + member profile (name, photo, pace group: easy / steady / fast)
2. QR check-in
3. Log km after the run (stepper defaults to 12.0, steps of 0.5; time is optional)
4. Streaks + badges (awarded automatically)
5. Leaderboard: Distance / Attendance / Streaks
6. Admin: create runs, show the QR code, post announcements, generate the WhatsApp recap

Later: route map page, photo wall, share cards, monthly club total.

## Files
- `supabase/schema.sql`: full database schema with RLS, views (`member_stats`, `member_streaks`, `run_recap`) and functions (`check_in`, `award_milestones`, `is_admin`). Tested on Postgres 16 with a stubbed `auth` schema.
- Screen designs (Home, Check-in, Profile, Leaderboard, Admin recap) are on Justice's Claude design canvas "Morning Mile Club Screens".
  - Look: navy `#101820`, sunrise orange `#F97316` (fills) / `#C2410C` (text), teal `#0F766E`, background `#F3F4EF`.
  - Fonts: Barlow Condensed (headings) and Barlow (body). Mobile-first, bottom nav with Home / Board / Profile.

## Status
Done: Next.js 16 scaffold (`cacheComponents` on, so request-time reads go inside `<Suspense>`; middleware is `src/proxy.ts`), Supabase auth (email/phone OTP + magic link via `/auth/callback`), onboarding (creates the `profiles` row), QR check-in at `src/app/checkin/[runId]`, km logging at `src/app/runs/[runId]/log`, and admin at `src/app/admin` (create runs, full-screen QR, tick-off list, complete/cancel).
- Badges are awarded when an admin marks a run completed (`setRunStatus`), since stats only count completed runs.
- RLS: members can only log km for runs they're checked in to.

## Next step
Leaderboard (Distance / Attendance / Streaks), profile page with badges, bottom nav, then announcements and the WhatsApp recap.
