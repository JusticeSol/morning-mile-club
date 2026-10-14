import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { lagosToday } from "@/lib/format";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type GoalProgress = {
  month: string; // YYYY-MM-01
  name: string;
  targetKm: number;
  km: number;
  daysLeft: number;
};

// First day of the current month in Lagos, and of the next month.
export function currentMonth() {
  const today = lagosToday(); // YYYY-MM-DD
  const start = `${today.slice(0, 7)}-01`;
  const d = new Date(`${start}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const next = d.toISOString().slice(0, 10);
  const daysLeft = Math.round((Date.parse(`${next}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  return { start, next, daysLeft };
}

// This month's club goal and how far the club has got: km logged on this
// month's runs (cancelled runs don't count). Null if no goal is set.
export async function getGoalProgress(supabase: Supabase): Promise<GoalProgress | null> {
  const { start, next, daysLeft } = currentMonth();

  const [{ data: goal }, { data: logs }] = await Promise.all([
    supabase.from("club_goals").select("month, name, target_km").eq("month", start).maybeSingle(),
    supabase
      .from("run_logs")
      .select("distance_km, runs!inner(run_date, status)")
      .gte("runs.run_date", start)
      .lt("runs.run_date", next)
      .neq("runs.status", "cancelled"),
  ]);
  if (!goal) return null;

  const km = (logs ?? []).reduce((sum, l) => sum + Number(l.distance_km), 0);
  return { month: goal.month, name: goal.name, targetKm: Number(goal.target_km), km, daysLeft };
}
