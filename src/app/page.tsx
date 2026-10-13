import { Suspense } from "react";
import Link from "next/link";
import { buttonClass, Card, Screen } from "@/components/ui";
import { RouteCard } from "@/components/route-card";
import { requireMember } from "@/lib/auth";
import { formatClockTime, formatDuration, formatRunDate, formatTime, lagosToday, memberName } from "@/lib/format";
import { RUN_COLUMNS, type Run } from "@/lib/types";

export default function Home() {
  return (
    <Screen eyebrow="Morning Mile Club" title="Every Saturday" nav="home">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <HomeBody />
      </Suspense>
    </Screen>
  );
}

async function HomeBody() {
  const { supabase, user, profile } = await requireMember("/");
  const today = lagosToday();

  // Latest run = today's or the most recent past one; next run = after today.
  const [{ data: latestRun }, { data: nextRun }] = await Promise.all([
    supabase
      .from("runs")
      .select(RUN_COLUMNS)
      .lte("run_date", today)
      .neq("status", "cancelled")
      .order("run_date", { ascending: false })
      .limit(1)
      .maybeSingle<Run>(),
    supabase
      .from("runs")
      .select(RUN_COLUMNS)
      .gt("run_date", today)
      .neq("status", "cancelled")
      .order("run_date")
      .limit(1)
      .maybeSingle<Run>(),
  ]);

  const [{ data: checkIn }, { data: log }] = latestRun
    ? await Promise.all([
        supabase.from("check_ins").select("id").eq("run_id", latestRun.id).eq("member_id", user.id).maybeSingle(),
        supabase
          .from("run_logs")
          .select("distance_km, duration_seconds")
          .eq("run_id", latestRun.id)
          .eq("member_id", user.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="space-y-4">
      <p className="text-lg">
        Hi <strong>{memberName(profile)}</strong> 👋
      </p>

      {latestRun && (
        <LatestRunCard
          run={latestRun}
          isToday={latestRun.run_date === today}
          checkedIn={!!checkIn}
          log={log as { distance_km: number; duration_seconds: number | null } | null}
        />
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
            <p className="mt-3 text-sm text-navy/60">On the day, tap Scan below to check in at the meetup.</p>
          </>
        ) : (
          <p className="text-navy/70">No run scheduled yet. Watch the WhatsApp group.</p>
        )}
      </Card>

      <RouteCard startTime={(nextRun ?? latestRun)?.start_time} />

      {profile.role === "admin" && (
        <Link href="/admin" className="block text-sm font-medium text-sunrise-ink underline">
          Admin: runs, QR code and tick-off list
        </Link>
      )}
    </div>
  );
}

function checkInNotClosed(run: Run) {
  return Date.parse(run.checkin_closes_at) > Date.now();
}

// One card that always tells the member what to do about the latest run:
// scan in, log km, edit km, or how to get ticked off.
function LatestRunCard({
  run,
  isToday,
  checkedIn,
  log,
}: {
  run: Run;
  isToday: boolean;
  checkedIn: boolean;
  log: { distance_km: number; duration_seconds: number | null } | null;
}) {
  const heading = (
    <p className="mb-3 text-navy/70">
      <span className="block font-display text-2xl font-bold uppercase text-navy">{run.title ?? "Saturday run"}</span>
      {isToday ? "Today" : formatRunDate(run.run_date)} · meet {formatClockTime(run.start_time)} · ~{run.default_km} km
    </p>
  );
  const label = (text: string) => (
    <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">{text}</p>
  );

  if (checkedIn && log) {
    return (
      <Card>
        {label(isToday ? "Today's run" : "Your last run")}
        {heading}
        <div className="flex items-end justify-between">
          <p>
            <span className="font-display text-4xl font-bold">{Number(log.distance_km).toFixed(1)}</span>{" "}
            <span className="text-navy/60">km{log.duration_seconds ? ` · ${formatDuration(log.duration_seconds)}` : ""}</span>
          </p>
          <Link href={`/runs/${run.id}/log`} className="text-sm font-medium text-sunrise-ink underline">
            Edit
          </Link>
        </div>
      </Card>
    );
  }

  if (checkedIn) {
    return (
      <Card>
        {label("How far did you go?")}
        {heading}
        <Link href={`/runs/${run.id}/log`} className={buttonClass}>
          Log my km
        </Link>
      </Card>
    );
  }

  // Not checked in. On run day, before check-in closes, send them to scan.
  const open = isToday && run.status === "scheduled" && checkInNotClosed(run);
  return (
    <Card>
      {label(isToday ? "Today's run" : "Your last run")}
      {heading}
      {open ? (
        <>
          <Link href="/scan" className={buttonClass}>
            Scan to check in
          </Link>
          <p className="mt-2 text-center text-sm text-navy/60">
            Check-in is open {formatTime(run.checkin_opens_at)}–{formatTime(run.checkin_closes_at)}.
          </p>
        </>
      ) : (
        <p className="text-sm text-navy/70">
          You weren&apos;t checked in to this run, so there&apos;s nothing to log. Were you there? Ask an organiser to
          tick you off, then log your km here.
        </p>
      )}
    </Card>
  );
}
