-- =====================================================================
-- Morning Mile Club — database schema (Supabase / Postgres)
-- Run in the Supabase SQL editor on a fresh project.
--
-- Design rules:
--   * Club-wide numbers (leaderboard, streaks, recap) come ONLY from
--     data members create on this site: QR check-ins + self-logged km.
--   * Strava data is stored privately and shown only to its owner,
--     per Strava's API terms. It never feeds shared views.
--   * Cancelled Saturdays (rain, holidays) don't break anyone's streak.
-- =====================================================================

-- ---------- Enums ----------------------------------------------------
create type member_role   as enum ('member', 'admin');
create type pace_group    as enum ('easy', 'steady', 'fast');
create type run_status    as enum ('scheduled', 'completed', 'cancelled');
create type checkin_method as enum ('qr', 'admin');
create type milestone_kind as enum ('streak', 'attendance', 'distance');

-- ---------- Members --------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null,
  display_name  text,
  avatar_url    text,
  phone         text,                       -- for WhatsApp links / magic login
  pace_group    pace_group default 'steady',
  role          member_role not null default 'member',
  bio           text,
  joined_at     timestamptz not null default now()
);

-- ---------- Routes ---------------------------------------------------
create table routes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,              -- e.g. 'Saturday Loop'
  distance_km   numeric(4,1) not null,
  meetup_point  text,
  description   text,
  map_url       text,                       -- link or stored GPX path
  created_at    timestamptz not null default now()
);

-- ---------- Saturday runs --------------------------------------------
create table runs (
  id                uuid primary key default gen_random_uuid(),
  run_date          date not null unique,
  title             text,                   -- e.g. 'Saturday #34'
  route_id          uuid references routes (id),
  default_km        numeric(4,1) not null default 12.0,
  start_time        time not null default '06:30',
  status            run_status not null default 'scheduled',
  checkin_opens_at  timestamptz,            -- defaults set by trigger below
  checkin_closes_at timestamptz,
  notes             text,
  created_by        uuid references profiles (id),
  created_at        timestamptz not null default now()
);

-- Check-in window: 06:00–08:45 Lagos time on run day, unless set manually.
create or replace function set_checkin_window() returns trigger
language plpgsql as $$
begin
  if new.checkin_opens_at is null then
    new.checkin_opens_at := (new.run_date + time '06:00') at time zone 'Africa/Lagos';
  end if;
  if new.checkin_closes_at is null then
    new.checkin_closes_at := (new.run_date + time '08:45') at time zone 'Africa/Lagos';
  end if;
  return new;
end $$;

create trigger runs_checkin_window
  before insert on runs
  for each row execute function set_checkin_window();

-- QR codes live in their own admin-only table so members can't read the
-- code from the API and check in from bed. One code per run, auto-created.
create table run_checkin_codes (
  run_id uuid primary key references runs (id) on delete cascade,
  code   text not null default substr(md5(gen_random_uuid()::text), 1, 12)
);

create or replace function create_checkin_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into run_checkin_codes (run_id) values (new.id);
  return new;
end $$;

create trigger runs_create_code
  after insert on runs
  for each row execute function create_checkin_code();

-- ---------- Attendance -----------------------------------------------
create table check_ins (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs (id) on delete cascade,
  member_id     uuid not null references profiles (id) on delete cascade,
  method        checkin_method not null default 'qr',
  checked_in_at timestamptz not null default now(),
  unique (run_id, member_id)
);

-- ---------- Self-logged distance (feeds the club leaderboard) ---------
create table run_logs (
  id               uuid primary key default gen_random_uuid(),
  run_id           uuid not null references runs (id) on delete cascade,
  member_id        uuid not null references profiles (id) on delete cascade,
  distance_km      numeric(4,1) not null check (distance_km > 0 and distance_km <= 60),
  duration_seconds integer check (duration_seconds > 0),
  logged_at        timestamptz not null default now(),
  unique (run_id, member_id)
);

-- ---------- Strava (PRIVATE: owner-only) -----------------------------
-- Tokens: no client access at all; only the server (service role) reads them.
create table strava_connections (
  member_id         uuid primary key references profiles (id) on delete cascade,
  strava_athlete_id bigint not null unique,
  access_token      text not null,
  refresh_token     text not null,
  expires_at        timestamptz not null,
  connected_at      timestamptz not null default now()
);

create table strava_activities (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid not null references profiles (id) on delete cascade,
  strava_activity_id bigint not null unique,
  start_date         timestamptz not null,
  distance_m         numeric(9,1) not null,
  moving_time_s      integer not null,
  synced_at          timestamptz not null default now()
);

-- ---------- Milestones / badges --------------------------------------
create table milestones (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,         -- 'streak_4', 'att_25', 'km_100'
  name        text not null,
  description text,
  kind        milestone_kind not null,
  threshold   numeric not null
);

create table member_milestones (
  member_id    uuid not null references profiles (id) on delete cascade,
  milestone_id uuid not null references milestones (id) on delete cascade,
  run_id       uuid references runs (id),   -- the Saturday it was earned
  earned_at    timestamptz not null default now(),
  primary key (member_id, milestone_id)
);

insert into milestones (code, name, description, kind, threshold) values
  ('att_1',     'First Mile',        'Your first Saturday with the club',  'attendance', 1),
  ('att_10',    'Regular',           '10 Saturdays attended',              'attendance', 10),
  ('att_25',    'Quarter Century',   '25 Saturdays attended',              'attendance', 25),
  ('att_52',    'Full Year',         '52 Saturdays attended',              'attendance', 52),
  ('streak_4',  'Month Strong',      '4 Saturdays in a row',               'streak',     4),
  ('streak_8',  'Locked In',         '8 Saturdays in a row',               'streak',     8),
  ('streak_12', 'Unbreakable',       '12 Saturdays in a row',              'streak',     12),
  ('km_100',    '100 km Club',       '100 km logged with the club',        'distance',   100),
  ('km_500',    '500 km Club',       '500 km logged with the club',        'distance',   500);

-- ---------- Announcements & photos -----------------------------------
create table announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  pinned     boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table run_photos (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references runs (id) on delete cascade,
  uploaded_by  uuid not null references profiles (id) on delete cascade,
  storage_path text not null,               -- Supabase Storage bucket path
  caption      text,
  created_at   timestamptz not null default now()
);

-- ---------- Indexes --------------------------------------------------
create index on check_ins (member_id);
create index on run_logs (member_id);
create index on strava_activities (member_id, start_date desc);
create index on run_photos (run_id);

-- =====================================================================
-- Stats views
-- =====================================================================

-- Streaks use "gaps and islands": number the completed Saturdays 1..N,
-- then consecutive attended Saturdays share the same (run_no - member_seq).
create or replace view member_streaks with (security_invoker = true) as
with completed as (
  select id, run_date,
         row_number() over (order by run_date) as run_no
  from runs
  where status = 'completed'
),
attended as (
  select c.member_id, r.run_no,
         r.run_no - row_number() over (partition by c.member_id order by r.run_no) as island
  from check_ins c
  join completed r on r.id = c.run_id
),
islands as (
  select member_id, island, count(*) as len, max(run_no) as last_run_no
  from attended
  group by member_id, island
),
latest as (select max(run_no) as n from completed)
select p.id as member_id,
       coalesce(max(i.len), 0) as longest_streak,
       coalesce(max(i.len) filter (where i.last_run_no = (select n from latest)), 0) as current_streak
from profiles p
left join islands i on i.member_id = p.id
group by p.id;

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
       s.longest_streak
from profiles p
join member_streaks s on s.member_id = p.id;

-- Per-Saturday summary — powers the WhatsApp recap.
create or replace view run_recap with (security_invoker = true) as
select r.id as run_id,
       r.run_date,
       r.title,
       r.status,
       (select count(*) from check_ins c where c.run_id = r.id)            as turnout,
       (select coalesce(sum(l.distance_km), 0) from run_logs l
         where l.run_id = r.id)                                             as club_km,
       (select count(*) from check_ins c
         where c.run_id = r.id
           and not exists (select 1 from check_ins c2
                             join runs r2 on r2.id = c2.run_id
                            where c2.member_id = c.member_id
                              and r2.run_date < r.run_date))                as first_timers
from runs r;

-- =====================================================================
-- Functions
-- =====================================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- QR check-in. The QR code links to /checkin/<run_id>?code=<checkin_code>.
-- Validates the code and the time window, then records attendance.
create or replace function check_in(p_run_id uuid, p_code text)
returns check_ins
language plpgsql security definer set search_path = public as $$
declare
  v_run runs;
  v_row check_ins;
begin
  if auth.uid() is null then
    raise exception 'Please log in first';
  end if;

  select * into v_run from runs where id = p_run_id;
  if not found then
    raise exception 'Run not found';
  end if;
  if v_run.status = 'cancelled' then
    raise exception 'This run was cancelled';
  end if;
  if not exists (select 1 from run_checkin_codes
                  where run_id = p_run_id and code = p_code) then
    raise exception 'Invalid check-in code';
  end if;
  if now() not between v_run.checkin_opens_at and v_run.checkin_closes_at then
    raise exception 'Check-in is closed for this run';
  end if;

  insert into check_ins (run_id, member_id, method)
  values (p_run_id, auth.uid(), 'qr')
  on conflict (run_id, member_id) do update set checked_in_at = check_ins.checked_in_at
  returning * into v_row;

  return v_row;
end $$;

-- Award any milestones a member has newly reached. Call after check-in / km log.
create or replace function award_milestones(p_member_id uuid, p_run_id uuid default null)
returns setof member_milestones
language plpgsql security definer set search_path = public as $$
begin
  return query
  insert into member_milestones (member_id, milestone_id, run_id)
  select p_member_id, m.id, p_run_id
  from milestones m
  join member_stats s on s.member_id = p_member_id
  where (m.kind = 'attendance' and s.saturdays_attended >= m.threshold)
     or (m.kind = 'streak'     and s.current_streak     >= m.threshold)
     or (m.kind = 'distance'   and s.total_km           >= m.threshold)
  on conflict do nothing
  returning *;
end $$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles           enable row level security;
alter table routes             enable row level security;
alter table runs               enable row level security;
alter table run_checkin_codes  enable row level security;
alter table check_ins          enable row level security;
alter table run_logs           enable row level security;
alter table strava_connections enable row level security;
alter table strava_activities  enable row level security;
alter table milestones         enable row level security;
alter table member_milestones  enable row level security;
alter table announcements      enable row level security;
alter table run_photos         enable row level security;

-- Profiles: members see each other; edit only yourself (not your role).
create policy "members read profiles" on profiles
  for select to authenticated using (true);
create policy "insert own profile" on profiles
  for insert to authenticated with check (id = auth.uid() and role = 'member');
create policy "update own profile" on profiles
  for update to authenticated using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "admins manage profiles" on profiles
  for all to authenticated using (is_admin()) with check (is_admin());

-- Routes, runs, announcements, milestones: everyone reads, admins write.
create policy "read routes" on routes for select to authenticated using (true);
create policy "admin routes" on routes for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin read codes" on run_checkin_codes
  for select to authenticated using (is_admin());

create policy "read runs" on runs for select to authenticated using (true);
create policy "admin runs" on runs for all to authenticated using (is_admin()) with check (is_admin());

create policy "read announcements" on announcements for select to authenticated using (true);
create policy "admin announcements" on announcements for all to authenticated using (is_admin()) with check (is_admin());

create policy "read milestones" on milestones for select to authenticated using (true);
create policy "admin milestones" on milestones for all to authenticated using (is_admin()) with check (is_admin());

-- Check-ins: everyone reads (attendance is public in the club);
-- members insert only through check_in(); admins can add manually.
create policy "read check_ins" on check_ins for select to authenticated using (true);
create policy "admin check_ins" on check_ins for all to authenticated using (is_admin()) with check (is_admin());

-- Run logs: everyone reads (leaderboard); members manage their own, and
-- can only log km for a run they checked in to (QR or ticked by an admin).
create policy "read run_logs" on run_logs for select to authenticated using (true);
create policy "own run_logs insert" on run_logs for insert to authenticated
  with check (member_id = auth.uid()
              and exists (select 1 from check_ins c
                           where c.run_id = run_logs.run_id and c.member_id = auth.uid()));
create policy "own run_logs update" on run_logs for update to authenticated using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy "own run_logs delete" on run_logs for delete to authenticated using (member_id = auth.uid());

-- Strava: activities visible to the owner only. Tokens: no policies at all,
-- so only the service role (your server / Strava webhook handler) can touch them.
create policy "own strava activities" on strava_activities
  for select to authenticated using (member_id = auth.uid());

-- Badges: everyone reads; only award_milestones() writes.
create policy "read member_milestones" on member_milestones for select to authenticated using (true);

-- Photos: everyone reads; upload your own; delete your own or as admin.
create policy "read photos" on run_photos for select to authenticated using (true);
create policy "upload own photos" on run_photos for insert to authenticated with check (uploaded_by = auth.uid());
create policy "delete own photos" on run_photos for delete to authenticated using (uploaded_by = auth.uid() or is_admin());
