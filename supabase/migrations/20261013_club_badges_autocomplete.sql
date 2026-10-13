-- =====================================================================
-- 2026-10-13 — Club badges + auto-complete runs
-- Run ONCE in the Supabase SQL Editor on a database created from the
-- earlier schema.sql. (A fresh install from schema.sql already has this.)
-- Safe to re-run.
-- =====================================================================

-- Badge kinds become text so we can add 'special' badges.
alter table milestones alter column kind type text using kind::text;
alter table milestones drop constraint if exists milestones_kind_check;
alter table milestones add constraint milestones_kind_check
  check (kind in ('streak', 'attendance', 'distance', 'special'));
drop type if exists milestone_kind;

-- Route-named attendance badges (1 / 4 / 7 / 10 Saturdays).
update milestones set name = 'Morning Mile Welcome', description = 'Your first Saturday with the club'  where code = 'att_1';
update milestones set name = 'Maryland Mall Legend', description = '10 Saturdays with the club'         where code = 'att_10';
update milestones set description = '25 Saturdays with the club' where code = 'att_25';
update milestones set description = '52 Saturdays with the club' where code = 'att_52';

insert into milestones (code, name, description, kind, threshold) values
  ('att_4',        'Harvesters Regular',       '4 Saturdays with the club',                    'attendance', 4),
  ('att_7',        'Anthony Stopover Veteran', '7 Saturdays with the club',                    'attendance', 7),
  ('wake_up_crew', 'Wake-Up Crew',             'One of the first 5 to check in at the meetup', 'special',    1),
  ('comeback',     'Comeback Kid',             'Back after missing 3 or more Saturdays',       'special',    1)
on conflict (code) do update
  set name = excluded.name, description = excluded.description,
      kind = excluded.kind, threshold = excluded.threshold;

-- Award any milestones a member has newly reached. Called after check-in,
-- km log, admin tick-off, and when a run is completed (manually or by
-- complete_past_runs()). Only completed runs count.
create or replace function award_milestones(p_member_id uuid, p_run_id uuid default null)
returns setof member_milestones
language plpgsql security definer set search_path = public as $$
begin
  return query
  with completed as (
    select id, row_number() over (order by run_date) as run_no
    from runs
    where status = 'completed'
  ),
  attended as (
    select r.run_no
    from check_ins c
    join completed r on r.id = c.run_id
    where c.member_id = p_member_id
  ),
  flags as (
    select
      -- Comeback Kid: missed 3+ completed Saturdays, then came back.
      exists (select 1
                from (select run_no - lag(run_no) over (order by run_no) as gap from attended) g
               where g.gap > 3) as comeback,
      -- Wake-Up Crew: among the first 5 QR check-ins at a completed run.
      exists (select 1
                from (select c.member_id,
                             row_number() over (partition by c.run_id order by c.checked_in_at) as pos
                        from check_ins c
                        join completed r on r.id = c.run_id
                       where c.method = 'qr') q
               where q.member_id = p_member_id and q.pos <= 5) as wake_up
  )
  insert into member_milestones (member_id, milestone_id, run_id)
  select p_member_id, m.id, p_run_id
  from milestones m
  join member_stats s on s.member_id = p_member_id
  cross join flags f
  where (m.kind = 'attendance' and s.saturdays_attended >= m.threshold)
     or (m.kind = 'streak'     and s.current_streak     >= m.threshold)
     or (m.kind = 'distance'   and s.total_km           >= m.threshold)
     or (m.code = 'wake_up_crew' and f.wake_up)
     or (m.code = 'comeback'     and f.comeback)
  on conflict do nothing
  returning *;
end $$;

-- Marks runs completed once their check-in window has closed, so streaks
-- and badges count even if no admin taps "Mark completed". Runs nobody
-- checked in to are left alone (an admin can cancel them). The app calls
-- this on page loads; it's a no-op most of the time.
create or replace function complete_past_runs()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_run_id uuid;
  v_member_id uuid;
  v_count integer := 0;
begin
  for v_run_id in
    update runs r
       set status = 'completed'
     where r.status = 'scheduled'
       and r.checkin_closes_at < now()
       and exists (select 1 from check_ins c where c.run_id = r.id)
    returning r.id
  loop
    v_count := v_count + 1;
    for v_member_id in select member_id from check_ins where run_id = v_run_id loop
      perform award_milestones(v_member_id, v_run_id);
    end loop;
  end loop;
  return v_count;
end $$;

-- Catch up: complete any past runs and award badges members already earned.
select complete_past_runs();
select award_milestones(id) from profiles;
