import { Suspense } from "react";
import Link from "next/link";
import { buttonClass, Card, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { formatClockTime, formatRunDate, lagosToday, memberName } from "@/lib/format";
import { RUN_COLUMNS, type Run } from "@/lib/types";
import { signOut } from "./actions";

export default function Home() {
  return (
    <Screen eyebrow="Morning Mile Club" title="Every Saturday">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <HomeBody />
      </Suspense>
    </Screen>
  );
}

async function HomeBody() {
  const { supabase, user, profile } = await requireMember("/");

  const today = lagosToday();

  const [{ data: nextRun }, { data: lastCheckIn }] = await Promise.all([
    supabase
      .from("runs")
      .select(RUN_COLUMNS)
      .gte("run_date", today)
      .neq("status", "cancelled")
      .order("run_date")
      .limit(1)
      .maybeSingle<Run>(),
    supabase
      .from("check_ins")
      .select("run_id, runs(run_date, title)")
      .eq("member_id", user.id)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ run_id: string; runs: { run_date: string; title: string | null } }>(),
  ]);

  // Prompt for km if the member's latest check-in has no log yet.
  let toLog: typeof lastCheckIn = null;
  if (lastCheckIn) {
    const { count } = await supabase
      .from("run_logs")
      .select("run_id", { count: "exact", head: true })
      .eq("run_id", lastCheckIn.run_id)
      .eq("member_id", user.id);
    if (count === 0) toLog = lastCheckIn;
  }

  return (
    <div className="space-y-4">
      <p className="text-lg">
        Hi <strong>{memberName(profile)}</strong> 👋
      </p>

      {toLog && (
        <Card>
          <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">How far did you go?</p>
          <p className="mb-4 text-navy/70">
            {toLog.runs.title ?? "Saturday run"} · {formatRunDate(toLog.runs.run_date)}
          </p>
          <Link href={`/runs/${toLog.run_id}/log`} className={buttonClass}>
            Log my km
          </Link>
        </Card>
      )}

      <Card>
        <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">Next run</p>
        {nextRun ? (
          <>
            <p className="font-display text-2xl font-bold uppercase">{nextRun.title ?? "Saturday run"}</p>
            <p className="text-navy/70">
              {formatRunDate(nextRun.run_date)} · meet {formatClockTime(nextRun.start_time)} · ~
              {nextRun.default_km} km
            </p>
            <p className="mt-3 text-sm text-navy/60">Scan the QR code at the meetup to check in.</p>
          </>
        ) : (
          <p className="text-navy/70">No run scheduled yet. Watch the WhatsApp group.</p>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        {profile.role === "admin" ? (
          <Link href="/admin" className="font-medium text-sunrise-ink underline">
            Admin
          </Link>
        ) : (
          <span />
        )}
        <form action={signOut}>
          <button className="text-navy/60 underline">Log out</button>
        </form>
      </div>
    </div>
  );
}
