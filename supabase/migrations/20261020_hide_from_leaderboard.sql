-- =====================================================================
-- 2026-10-20 — "Hide me from the leaderboard"
-- A member can switch this on from their Profile page. They disappear from
-- the leaderboard and the WhatsApp recap's streak shout-outs; their check-ins
-- and km still count in club totals, streaks and badges.
-- Run ONCE in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

alter table profiles
  add column if not exists hide_from_leaderboard boolean not null default false;

-- Same view as before, with the new column added at the end.
create or replace view member_stats with (security_invoker = true) as
select p.id as member_id,
       p.full_name,
       p.display_name,
       p.avatar_url,
       p.pace_group,
       (select count(*) from check_ins c
          join runs r on r.id = c.run_id and r.status = 'completed'
         where c.member_id = p.id)                         as saturdays_attended,
       (select coalesce(sum(l.distance_km), 0) from run_logs l
         where l.member_id = p.id)                         as total_km,
       (select max(l.distance_km) from run_logs l
         where l.member_id = p.id)                         as longest_run_km,
       s.current_streak,
       s.longest_streak,
       p.hide_from_leaderboard
from profiles p
join member_streaks s on s.member_id = p.id;
