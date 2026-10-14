-- =====================================================================
-- 2026-10-14 (b) — Check-in closes at 08:20 (was 08:45)
-- Check-in closes, the run auto-completes and km logging opens at 08:20;
-- km logging still closes at 10:45. Run ONCE in the Supabase SQL Editor
-- after the earlier files. Safe to re-run.
-- =====================================================================

-- New runs default to closing check-in at 08:20.
create or replace function set_checkin_window() returns trigger
language plpgsql as $$
begin
  if new.checkin_opens_at is null then
    new.checkin_opens_at := (new.run_date + time '06:00') at time zone 'Africa/Lagos';
  end if;
  if new.checkin_closes_at is null then
    new.checkin_closes_at := (new.run_date + time '08:20') at time zone 'Africa/Lagos';
  end if;
  return new;
end $$;

-- Km logging: 08:20 → 10:45 (2 h 25 min after check-in closes).
create or replace function km_logging_open(p_run_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from runs r
     where r.id = p_run_id
       and r.status <> 'cancelled'
       and now() >= r.checkin_closes_at
       and now() <  r.checkin_closes_at + interval '2 hours 25 minutes'
  );
$$;

-- Move runs that haven't happened yet (and still have the old default) to 08:20.
update runs
   set checkin_closes_at = (run_date + time '08:20') at time zone 'Africa/Lagos'
 where status = 'scheduled'
   and checkin_closes_at = (run_date + time '08:45') at time zone 'Africa/Lagos'
   and checkin_closes_at > now();
