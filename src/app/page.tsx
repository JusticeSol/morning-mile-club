import { Suspense } from "react";
import Link from "next/link";
import { buttonClass, Card, Screen } from "@/components/ui";
import { GoalCard } from "@/components/goal-card";
import { RouteCard } from "@/components/route-card";
import { RsvpButton } from "@/components/rsvp-button";
import { ShareCardButton } from "@/components/share-card-button";
import { getGoalProgress } from "@/lib/goal";
import { requireMember } from "@/lib/auth";
import { formatClockTime, formatDuration, formatRunDate, formatTime, lagosToday, memberName } from "@/lib/format";
import { kmWindow } from "@/lib/km-window";
import { RUN_COLUMNS, type Run } from "@/lib/types";

export default function Home() {
  return (
    <Screen eyebrow="Morning Mile Club" title="Let's run" nav="home">
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

  const [goal, { data: rsvps }] = await Promise.all([
    getGoalProgress(supabase),
    nextRun
      ? supabase.from("rsvps").select("member_id, profiles(full_name, display_name)").eq("run_id", nextRun.id)
      : Promise.resolve({ data: [] }),
  ]);
  const coming = (rsvps ?? []) as unknown as { member_id: string; profiles: { full_name: string; display_name: string | null } }[];
  const imIn = coming.some((r) => r.member_id === user.id);

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

      {goal ? (
        <GoalCard goal={goal} />
      ) : (
        profile.role === "admin" && (
          <Link href="/admin#goal" className="block rounded-2xl border-2 border-dashed border-navy/15 p-4 text-center text-sm font-medium text-sunrise-ink">
            Set this month&apos;s club goal →
          </Link>
        )
      )}

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
              {formatRunDate(nextRun.run_date)} · run starts {formatClockTime(nextRun.start_time)} · ~
              {nextRun.default_km} km
            </p>
            <RsvpButton
              runId={nextRun.id}
              going={imIn}
              count={coming.length}
              names={coming.filter((r) => r.member_id !== user.id).map((r) => memberName(r.profiles))}
            />
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
      {isToday ? "Today" : formatRunDate(run.run_date)} · run starts {formatClockTime(run.start_time)} · ~{run.default_km} km
    </p>
  );
  const label = (text: string) => (
    <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">{text}</p>
  );
  const km = kmWindow(run);
  const note = (text: string) => <p className="mt-2 text-center text-sm text-navy/60">{text}</p>;

  if (checkedIn && log) {
    return (
      <Card>
        {label(isToday ? "Today's run" : "Your last run")}
        {heading}
        <div className="flex items-end justify-between">
          <p>
            <span className="font-hand text-4xl">{Number(log.distance_km).toFixed(1)}</span>{" "}
            <span className="text-navy/60">km{log.duration_seconds ? ` · ${formatDuration(log.duration_seconds)}` : ""}</span>
          </p>
          {km.phase === "open" && (
            <Link href={`/runs/${run.id}/log`} className="text-sm font-medium text-sunrise-ink underline">
              Edit
            </Link>
          )}
        </div>
        {km.phase === "open" && note(`You can change it until ${formatTime(km.closesAt)}.`)}
        <ShareCardButton runId={run.id} className="mt-4" />
      </Card>
    );
  }

  if (checkedIn) {
    return (
      <Card>
        {label(km.phase === "before" ? "You're checked in ✓" : "How far did you go?")}
        {heading}
        {km.phase === "before" ? (
          <>
            <p className="text-sm text-navy/70">
              Enjoy the run! Log your km afterwards, between {formatTime(km.opensAt)} and {formatTime(km.closesAt)}.
            </p>
            <ShareCardButton runId={run.id} className="mt-4" />
          </>
        ) : km.phase === "open" ? (
          <>
            <Link href={`/runs/${run.id}/log`} className={buttonClass}>
              Log my km
            </Link>
            {note(`Logging closes at ${formatTime(km.closesAt)}.`)}
          </>
        ) : (
          <p className="text-sm text-navy/70">
            You didn&apos;t log km for this run. Logging closed at {formatTime(km.closesAt)}.
          </p>
        )}
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
          You weren&apos;t checked in to this run, so there&apos;s nothing to log.
          {km.phase !== "closed" &&
            ` Were you there? Ask an organiser to tick you off, then log your km here before ${formatTime(km.closesAt)}.`}
        </p>
      )}
    </Card>
  );
}
