-- =====================================================================
-- 2026-10-14 — Club goal + "I'm in" RSVPs
-- Run ONCE in the Supabase SQL Editor after the 20261013 files.
-- Safe to re-run. Only creates two new tables and their rules.
-- =====================================================================

-- ---------- Club goal (one per month, set by admins) -----------------
-- Progress = km members logged on that month's (non-cancelled) runs.
create table if not exists club_goals (
  month      date primary key check (extract(day from month) = 1), -- first of the month
  name       text not null,                -- e.g. 'Gbagada → Abuja'
  target_km  numeric(6,1) not null check (target_km > 0 and target_km <= 99999),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ---------- "I'm in" for an upcoming Saturday -------------------------
create table if not exists rsvps (
  run_id     uuid not null references runs (id) on delete cascade,
  member_id  uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (run_id, member_id)
);

alter table club_goals enable row level security;
alter table rsvps      enable row level security;

-- Goals: everyone reads; admins set them.
drop policy if exists "read club_goals" on club_goals;
drop policy if exists "admin club_goals" on club_goals;
create policy "read club_goals" on club_goals for select to authenticated using (true);
create policy "admin club_goals" on club_goals for all to authenticated using (is_admin()) with check (is_admin());

-- RSVPs: everyone reads (who's coming); members add or remove their own,
-- only for a scheduled run whose check-in hasn't closed yet.
drop policy if exists "read rsvps" on rsvps;
drop policy if exists "own rsvps insert" on rsvps;
drop policy if exists "own rsvps delete" on rsvps;
create policy "read rsvps" on rsvps for select to authenticated using (true);
create policy "own rsvps insert" on rsvps for insert to authenticated
  with check (member_id = auth.uid()
              and exists (select 1 from runs r
                           where r.id = rsvps.run_id and r.status = 'scheduled' and r.checkin_closes_at > now()));
create policy "own rsvps delete" on rsvps for delete to authenticated
  using (member_id = auth.uid()
         and exists (select 1 from runs r
                      where r.id = rsvps.run_id and r.status = 'scheduled' and r.checkin_closes_at > now()));
