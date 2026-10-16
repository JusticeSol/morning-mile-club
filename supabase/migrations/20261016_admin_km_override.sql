-- =====================================================================
-- 2026-10-16 — Admin km override
-- Members still log their own km 08:20–10:45. Admins can add or fix a
-- member's km at any time (forgot to log, dead phone, a typo), from the
-- run's tick-off list. Run ONCE in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

drop policy if exists "admin run_logs" on run_logs;
create policy "admin run_logs" on run_logs for all to authenticated
  using (is_admin()) with check (is_admin());
