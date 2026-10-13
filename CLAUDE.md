# Morning Mile Club — club website

Web app for the Morning Mile Club, a running club that runs every Saturday
(meet 6:30 AM, ~12–13 km, finish ~8:30). Built by Justice (GitHub: JusticeSol).

## The Saturday route (use these names in copy, badges and recaps)
- Meet ~6:00 AM at **Gbagada General Hospital**; leave 6:30 and stroll to **Harvesters Church** by the expressway, where the run starts.
- Run to **Anthony** (stopover, ~5 min break), then on to **Maryland Shopping Mall**: the turnaround, where the group takes photos, high-fives and banters.
- Stroll back to Anthony, then run back to Gbagada General Hospital. Back by ~8:30–8:45. About 2 hours in all.
- A few early risers post wake-up reminders in the WhatsApp group before 6 AM; they're the natural admin group.

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
- `supabase/migrations/`: one-off SQL updates for databases created from an older `schema.sql` (Justice runs them in the Supabase SQL Editor). Keep `schema.sql` as the full current schema too.
- `supabase/schema.sql`: full database schema with RLS, views (`member_stats`, `member_streaks`, `run_recap`) and functions (`check_in`, `award_milestones`, `is_admin`). Tested on Postgres 16 with a stubbed `auth` schema.
- Screen designs (Home, Check-in, Profile, Leaderboard, Admin recap) are on Justice's Claude design canvas "Morning Mile Club Screens".
  - Look: navy `#101820`, sunrise orange `#F97316` (fills) / `#C2410C` (text), teal `#0F766E`, background `#F3F4EF`.
  - Fonts: Barlow Condensed (headings) and Barlow (body). Mobile-first, bottom nav with Home / Board / Profile.

## Status
Done: Next.js 16 scaffold (`cacheComponents` on, so request-time reads go inside `<Suspense>`; middleware is `src/proxy.ts`), Supabase auth (email/phone OTP + magic link via `/auth/callback`), onboarding (creates the `profiles` row), QR check-in at `src/app/checkin/[runId]`, km logging at `src/app/runs/[runId]/log`, admin at `src/app/admin` (create runs, full-screen QR, tick-off list, complete/cancel), leaderboard at `src/app/leaderboard` (Distance / Attendance / Streaks from `member_stats`), and profile at `src/app/profile` (stats, badges, recent runs, edit). Bottom nav is the `nav` prop on `Screen` in `src/components/ui.tsx`.
- Runs auto-complete after check-in closes (`complete_past_runs()`, called from `requireMember`); that's when Saturday/streak badges land. Admins can still complete early or cancel.
- Badges: attendance 1/4/7/10 (+25/52) are named after the route; special badges Wake-Up Crew (first 5 QR check-ins) and Comeback Kid (back after missing 3+ Saturdays). Logic in `award_milestones()`.
- Admin WhatsApp page (`/admin/runs/[runId]/whatsapp`): morning reminder + post-run recap, built in `src/lib/whatsapp.ts`.
- The route is in `src/lib/route.ts` and shown on the home page.
- RLS: members can only log km for runs they're checked in to.

## Open decisions (remind Justice)
Justice asked to be reminded about these until a decision is made. Bring them up briefly at the start of a session and whenever related work comes up (admin, km logging, leaderboard, recap). Remove an item once it's decided.
- **Auto-credit km on "Mark completed"?** When an admin marks a run completed, give the run's planned distance (`default_km`) to members who checked in but didn't log km, so forgetting to log doesn't drop them down the Distance board. Members would only log when they ran a different distance. Undecided as of 2026-10-13.
- **Lock km logging until check-in closes?** Members can currently log right after checking in, before the run is over. Undecided.

## Next step
Club goal (e.g. "Gbagada → Ibadan, 130 km" progress bar), then share cards for WhatsApp status, "I'm in" RSVP, pace-group boards, profile photos, Maryland Mall photo of the week, announcements.
