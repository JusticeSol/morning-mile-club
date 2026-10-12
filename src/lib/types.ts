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
