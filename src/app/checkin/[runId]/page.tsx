import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, Message, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { formatClockTime, formatRunDate, formatTime, memberName } from "@/lib/format";
import { RUN_COLUMNS, type CheckIn, type Run } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { CheckInButton, CheckedIn } from "./check-in-button";

// The QR shown at the meetup links here: /checkin/<run_id>?code=<code>.
// Viewing the page never checks anyone in. That needs a tap, so WhatsApp
// link previews and browser prefetches can't record attendance.
export default function CheckInPage({ params, searchParams }: PageProps<"/checkin/[runId]">) {
  return (
    <Screen eyebrow="Saturday check-in" title="Check in" nav>
      <Card>
        <Suspense fallback={<p className="text-navy/60">Loading run…</p>}>
          <CheckInBody params={params} searchParams={searchParams} />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function CheckInBody({ params, searchParams }: PageProps<"/checkin/[runId]">) {
  const { runId } = await params;
  const { code: rawCode } = await searchParams;
  const code = typeof rawCode === "string" ? rawCode : "";
  if (!isUuid(runId)) notFound();

  const here = `/checkin/${runId}${code ? `?code=${encodeURIComponent(code)}` : ""}`;
  const { supabase, user, profile } = await requireMember(here);

  const [{ data: run }, { data: existing }] = await Promise.all([
    supabase
      .from("runs")
      .select(RUN_COLUMNS)
      .eq("id", runId)
      .maybeSingle<Run>(),
    supabase
      .from("check_ins")
      .select("id, run_id, member_id, checked_in_at")
      .eq("run_id", runId)
      .eq("member_id", user.id)
      .maybeSingle<CheckIn>(),
  ]);
  if (!run) notFound();

  const phase = checkInPhase(run);

  return (
    <div className="space-y-5">
      <div className="border-b border-navy/10 pb-4">
        <p className="font-display text-2xl font-bold uppercase leading-tight">
          {run.title ?? "Saturday run"}
        </p>
        <p className="text-navy/70">
          {formatRunDate(run.run_date)} · meet {formatClockTime(run.start_time)} · ~{run.default_km} km
        </p>
      </div>
      <CheckInStatus run={run} existing={existing} phase={phase} code={code} name={memberName(profile)} />
    </div>
  );
}

type Phase = "early" | "open" | "closed";

// The database enforces the window too; this just avoids a pointless tap.
function checkInPhase(run: Run): Phase {
  const now = Date.now();
  if (now < Date.parse(run.checkin_opens_at)) return "early";
  if (now > Date.parse(run.checkin_closes_at)) return "closed";
  return "open";
}

function CheckInStatus({
  run,
  existing,
  phase,
  code,
  name,
}: {
  run: Run;
  existing: CheckIn | null;
  phase: Phase;
  code: string;
  name: string;
}) {
  if (existing) return <CheckedIn checkedInAt={existing.checked_in_at} />;

  if (run.status === "cancelled") {
    return <Message tone="info">This run was cancelled. See you next Saturday!</Message>;
  }
  if (!code) {
    return <Message tone="error">This link is missing its check-in code. Scan the QR code shown at the meetup.</Message>;
  }

  if (phase === "early") {
    return (
      <Message tone="info">
        Check-in opens at {formatTime(run.checkin_opens_at)} on {formatRunDate(run.run_date)}.
      </Message>
    );
  }
  if (phase === "closed") {
    return <Message tone="info">Check-in for this run closed at {formatTime(run.checkin_closes_at)}.</Message>;
  }

  return <CheckInButton runId={run.id} code={code} name={name} />;
}
