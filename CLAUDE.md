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
- **Attendance via QR check-in** at the meetup. The QR links to `/checkin/<run_id>?code=<code>`. Codes live in an admin-only table, and the check-in window is 06:00–08:20 Lagos time.
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
  - Fonts: Barlow Condensed (headings, buttons, labels) and Barlow (body). Page titles and big numbers use the hand-painted Permanent Marker (`font-hand`), chosen by Justice on 2026-10-15. Mobile-first, bottom nav with Home / Scan / Board / Profile.
  - Home headline / slogan: "LET'S RUN" (under the "Morning Mile Club" eyebrow).

## Status
Done: Next.js 16 scaffold (`cacheComponents` on, so request-time reads go inside `<Suspense>`; middleware is `src/proxy.ts`), Supabase auth (email/phone OTP + magic link via `/auth/callback`), onboarding (creates the `profiles` row), QR check-in at `src/app/checkin/[runId]`, km logging at `src/app/runs/[runId]/log`, admin at `src/app/admin` (create runs, full-screen QR, tick-off list, complete/cancel), leaderboard at `src/app/leaderboard` (Distance / Attendance / Streaks from `member_stats`), and profile at `src/app/profile` (stats, badges, recent runs, edit). Bottom nav is the `nav` prop on `Screen` in `src/components/ui.tsx`.
- Runs auto-complete after check-in closes (`complete_past_runs()`, called from `requireMember`); that's when Saturday/streak badges land. Admins can still complete early or cancel.
- Badges: attendance 1/4/7/10 (+25/52) are named after the route; special badges Wake-Up Crew (first 5 QR check-ins) and Comeback Kid (back after missing 3+ Saturdays). Logic in `award_milestones()`.
- Admin WhatsApp page (`/admin/runs/[runId]/whatsapp`): morning reminder + post-run recap, built in `src/lib/whatsapp.ts`.
- The route is in `src/lib/route.ts` and shown on the home page.
- Club goal: one per month in `club_goals`, set by admins on /admin; progress = km logged on that month's non-cancelled runs (`src/lib/goal.ts`). Shown on home and in the recap.
- "I'm in" RSVPs (`rsvps` table) on the home page's Next run card; count shown on the admin run page and in the morning reminder.
- Share cards: `/share/[runId]/card` renders a 1080×1920 PNG (next/og, fonts in `assets/fonts`, traced via `outputFileTracingIncludes`). Own card only; club data only, never Strava.
- Leaderboard has a pace-group filter (`?pace=easy|steady|fast`).
- Km logging (decided 2026-10-13): members log their own km by hand, only for runs they checked in to, and only in a window from check-in close until 2 h 25 min later (08:20–10:45; times changed 2026-10-14). Enforced by `km_logging_open()` in RLS; `src/lib/km-window.ts` mirrors it for the UI. No automatic km for people who forget: it would put false figures on the board.
- Admin km override (decided 2026-10-16): admins can add or fix any checked-in member's km at any time, from the tick-off list (`/admin/runs/[runId]/km/[memberId]`, RLS policy "admin run_logs"). The km form is shared: `src/components/km-form.tsx`.
- Announcements (2026-10-20): admins post a headline + message on /admin (optionally pinned); members see them as banners at the top of the home page. Pinned ones stay until unpinned, others show for 7 days (`src/lib/announcements.ts`). Uses the existing `announcements` table, no migration.
- "Hide me from the leaderboard" (2026-10-20): switch on the Profile page (`profiles.hide_from_leaderboard`, also exposed on `member_stats`). Hidden members are left out of the leaderboard (they still see their own position, privately) and the WhatsApp recap's streak shout-outs; their runs still count for streaks, badges and the club goal. Admins still see them on the tick-off list.
- Profile photos (2026-10-20): Profile → Edit profile → "Add a photo". The browser crops/shrinks to a 512×512 JPEG (`src/app/profile/photo-upload.tsx`), a server action uploads it to the public-read `avatars` Storage bucket under `<user id>/` and sets `profiles.avatar_url`; old files are deleted. `Avatar` in `ui.tsx` shows the photo or initials (leaderboard, profile).
- Photo of the week (2026-10-20): admins post one group photo per run (+ optional caption) on `/admin/runs/[runId]`; posting again replaces it. Shown on the home page for 14 days after the run (`src/lib/run-photo.ts`). Resized in the browser to ≤1600px JPEG (`src/lib/resize-image.ts`), stored in the public-read `run-photos` bucket; only admins can write (`run_photos` "admin photos" policy).
- Instagram (2026-10-27): @themorningmileclub (`src/lib/social.ts`), linked from the Photo of the week card, the bottom of Profile, and the WhatsApp recap (the line at the bottom of Home was removed 2026-11-05: the photo card already links it). Link only; no feed embed (Meta's API needs app review).
- New club logo (2026-11-05): community designer's logo, dark version (white on dark, tagline "beyond the finish line"). Accent recoloured from lime to the app's sunrise orange for now (Justice, 2026-11-05; lime may come back if the designer prefers). Transparent PNGs of both versions, orange and original accent, in `promo/brand/` (cut from the JPEGs in `promo/screenshots/`). In the app: `public/brand/mark.png` (circle, no tagline) at the right of every `Screen` header, `public/brand/logo.png` (with tagline) on the login page; app icons are the circle mark on navy.
- Site basics (2026-11-11): link-preview image `src/app/opengraph-image.jpg` (1200×630, logo + "Every Saturday, 6 AM", ~80 KB so WhatsApp shows it; `metadataBase` in `layout.tsx`), branded 404 at `src/app/not-found.tsx`, login logo shrunk to 160px so "Send me a code" stays above the fold on small phones. Skipped on purpose: per-page titles/descriptions, robots.txt, sitemap, favicon.ico, analytics (members-only app, joined via WhatsApp). Privacy policy pending: Justice Joseph Undie is responsible for the data; contact email still to confirm.
- Installable (PWA, 2026-10-16): `src/app/manifest.ts`, icons in `public/icons` + `src/app/icon.png` / `apple-icon.png` (the club logo's circle mark since 2026-11-05; was MMC over a sunrise), "Add to home screen" card on the home page (`src/components/install-prompt.tsx`). No service worker / offline mode on purpose.

## Open decisions (remind Justice)
Justice asked to be reminded about undecided items until a decision is made. Bring them up briefly at the start of a session and whenever related work comes up. Remove an item once it's decided. None open right now.

## Next step
Ideas for later: members adding their own run photos (photo wall), photo on the share card.
