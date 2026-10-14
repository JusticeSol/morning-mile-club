import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, Message, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { formatDuration, formatRunDate, formatTime } from "@/lib/format";
import { kmWindow } from "@/lib/km-window";
import { RUN_COLUMNS, type Run, type RunLog } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { LogForm } from "./log-form";

export default function LogPage({ params }: PageProps<"/runs/[runId]/log">) {
  return (
    <Screen eyebrow="After the run" title="Log your km" nav>
      <Card>
        <Suspense fallback={<p className="text-navy/60">Loading…</p>}>
          <LogBody params={params} />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function LogBody({ params }: Pick<PageProps<"/runs/[runId]/log">, "params">) {
  const { runId } = await params;
  if (!isUuid(runId)) notFound();

  const { supabase, user } = await requireMember(`/runs/${runId}/log`);

  const [{ data: run }, { data: checkIn }, { data: log }] = await Promise.all([
    supabase.from("runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle<Run>(),
    supabase.from("check_ins").select("id").eq("run_id", runId).eq("member_id", user.id).maybeSingle(),
    supabase
      .from("run_logs")
      .select("run_id, member_id, distance_km, duration_seconds")
      .eq("run_id", runId)
      .eq("member_id", user.id)
      .maybeSingle<RunLog>(),
  ]);
  if (!run) notFound();

  const km = kmWindow(run);
  const logged = log && (
    <>
      You logged <strong>{Number(log.distance_km).toFixed(1)} km</strong>
      {log.duration_seconds ? ` in ${formatDuration(log.duration_seconds)}` : ""}.{" "}
    </>
  );

  return (
    <div className="space-y-5">
      <div className="border-b border-navy/10 pb-4">
        <p className="font-display text-2xl font-bold uppercase leading-tight">{run.title ?? "Saturday run"}</p>
        <p className="text-navy/70">{formatRunDate(run.run_date)}</p>
      </div>
      {run.status === "cancelled" ? (
        <Message tone="info">This run was cancelled, so there&apos;s nothing to log.</Message>
      ) : !checkIn ? (
        <Message tone="info">
          Check in at the meetup first by scanning the QR code. Forgot? Ask an organiser to tick you off before{" "}
          {formatTime(km.closesAt)}, then come back here.
        </Message>
      ) : km.phase === "before" ? (
        <Message tone="info">
          Enjoy the run! Log your km after it, between {formatTime(km.opensAt)} and {formatTime(km.closesAt)}.
        </Message>
      ) : km.phase === "closed" ? (
        <Message tone="info">
          {logged ?? "You didn't log km for this run. "}
          Km logging for this run closed at {formatTime(km.closesAt)}.
        </Message>
      ) : (
        <>
          <Message tone="info">
            {logged && <>{logged}Change it below if you need to. </>}
            Logging closes at {formatTime(km.closesAt)}.
          </Message>
          <LogForm
            runId={run.id}
            initialKm={Number(log?.distance_km ?? run.default_km)}
            initialSeconds={log?.duration_seconds ?? null}
            hasLog={!!log}
          />
        </>
      )}
    </div>
  );
}
