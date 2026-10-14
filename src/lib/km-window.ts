import type { Run } from "@/lib/types";

// Km logging opens when check-in closes (after the run, 08:20) and stays
// open for 2 h 25 min, until 10:45. Must match km_logging_open() in
// supabase/schema.sql, which is what actually enforces it.
export const KM_WINDOW_MINUTES = 145;

export type KmPhase = "before" | "open" | "closed";

export function kmWindow(run: Pick<Run, "checkin_closes_at" | "status">) {
  const opens = Date.parse(run.checkin_closes_at);
  const closes = opens + KM_WINDOW_MINUTES * 60 * 1000;
  const now = Date.now();
  const phase: KmPhase =
    run.status === "cancelled" || now >= closes ? "closed" : now < opens ? "before" : "open";
  return { phase, opensAt: new Date(opens).toISOString(), closesAt: new Date(closes).toISOString() };
}
