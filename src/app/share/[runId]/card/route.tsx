import { createClient } from "@/lib/supabase/server";
import { memberName } from "@/lib/format";
import { isUuid } from "@/lib/uuid";
import { cardImage } from "./card";

// The signed-in member's own run card for WhatsApp status ("I ran 12.5 km
// with Morning Mile Club"). Club data only (check-ins, logged km), never Strava.
export async function GET(_req: Request, ctx: RouteContext<"/share/[runId]/card">) {
  const { runId } = await ctx.params;
  if (!isUuid(runId)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Please log in", { status: 401 });

  const [{ data: profile }, { data: run }, { data: checkIn }, { data: log }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("full_name, display_name, pace_group").eq("id", user.id).maybeSingle(),
    supabase.from("runs").select("run_date, title").eq("id", runId).maybeSingle(),
    supabase.from("check_ins").select("id").eq("run_id", runId).eq("member_id", user.id).maybeSingle(),
    supabase
      .from("run_logs")
      .select("distance_km, duration_seconds")
      .eq("run_id", runId)
      .eq("member_id", user.id)
      .maybeSingle(),
    supabase
      .from("member_stats")
      .select("saturdays_attended, total_km, current_streak")
      .eq("member_id", user.id)
      .maybeSingle(),
  ]);
  if (!profile || !run || !checkIn) return new Response("Not found", { status: 404 });

  return cardImage({
    name: memberName(profile),
    paceGroup: profile.pace_group,
    runTitle: run.title ?? "Saturday run",
    runDate: run.run_date,
    km: log ? Number(log.distance_km) : null,
    durationSeconds: log?.duration_seconds ? Number(log.duration_seconds) : null,
    streak: Number(stats?.current_streak ?? 0),
    saturdays: Number(stats?.saturdays_attended ?? 0),
    totalKm: Number(stats?.total_km ?? 0),
  });
}
