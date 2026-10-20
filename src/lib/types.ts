// Row shapes for the parts of supabase/schema.sql the app reads.
// Swap for generated types (`supabase gen types typescript`) once the
// project is linked.

export type PaceGroup = "easy" | "steady" | "fast";
export type RunStatus = "scheduled" | "completed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  pace_group: PaceGroup | null;
  role: "member" | "admin";
  hide_from_leaderboard: boolean;
};

export type Run = {
  id: string;
  run_date: string; // YYYY-MM-DD
  title: string | null;
  default_km: number;
  start_time: string; // HH:MM:SS
  status: RunStatus;
  checkin_opens_at: string;
  checkin_closes_at: string;
};

export type CheckIn = {
  id: string;
  run_id: string;
  member_id: string;
  checked_in_at: string;
};

export type RunLog = {
  run_id: string;
  member_id: string;
  distance_km: number;
  duration_seconds: number | null;
};

// Row of the member_stats view (club-created data only: check-ins + km logs).
export type MemberStats = {
  member_id: string;
  full_name: string;
  display_name: string | null;
  pace_group: PaceGroup | null;
  saturdays_attended: number;
  total_km: number;
  longest_run_km: number | null;
  current_streak: number;
  longest_streak: number;
  hide_from_leaderboard: boolean;
};

export const STATS_COLUMNS =
  "member_id, full_name, display_name, pace_group, saturdays_attended, total_km, longest_run_km, current_streak, longest_streak, hide_from_leaderboard";

export type Milestone = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: "streak" | "attendance" | "distance" | "special";
  threshold: number;
};

export const RUN_COLUMNS =
  "id, run_date, title, default_km, start_time, status, checkin_opens_at, checkin_closes_at";
