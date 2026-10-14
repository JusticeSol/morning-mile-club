-- =====================================================================
-- 2026-10-13 (b) — Km logging window
-- Members can log km only from when check-in closes until 2 hours later
-- (08:45–10:45 by default). Run ONCE in the Supabase SQL Editor after
-- 20261013_club_badges_autocomplete.sql. Safe to re-run.
-- (Supabase may warn about "destructive operations": it only replaces
-- the three run_logs policies; no data is touched.)
-- =====================================================================

-- Km logging window: opens when check-in closes (after the run) and stays
-- open for 2 hours, i.e. 08:45–10:45 Lagos time by default. Members log
-- their own km by hand; nobody gets km automatically.
create or replace function km_logging_open(p_run_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from runs r
     where r.id = p_run_id
       and r.status <> 'cancelled'
       and now() >= r.checkin_closes_at
       and now() <  r.checkin_closes_at + interval '2 hours'
  );
$$;

-- Run logs: everyone reads (leaderboard); members manage their own, only
-- for a run they checked in to (QR or ticked by an admin), and only while
-- the km logging window is open.
drop policy if exists "own run_logs insert" on run_logs;
drop policy if exists "own run_logs update" on run_logs;
drop policy if exists "own run_logs delete" on run_logs;
create policy "own run_logs insert" on run_logs for insert to authenticated
  with check (member_id = auth.uid()
              and km_logging_open(run_id)
              and exists (select 1 from check_ins c
                           where c.run_id = run_logs.run_id and c.member_id = auth.uid()));
create policy "own run_logs update" on run_logs for update to authenticated
  using (member_id = auth.uid() and km_logging_open(run_id))
  with check (member_id = auth.uid() and km_logging_open(run_id));
create policy "own run_logs delete" on run_logs for delete to authenticated
  using (member_id = auth.uid() and km_logging_open(run_id));
