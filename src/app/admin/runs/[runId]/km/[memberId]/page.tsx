import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Message, Screen } from "@/components/ui";
import { KmForm } from "@/components/km-form";
import { requireAdmin } from "@/lib/auth";
import { formatDuration, formatRunDate, memberName } from "@/lib/format";
import { RUN_COLUMNS, type Run, type RunLog } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { adminRemoveKm, adminSaveKm } from "../../../../actions";

// Admin km override for one member. Its own page (not inline in the
// tick-off list) because that list auto-refreshes and would wipe typing.
export default function AdminKmPage({ params }: PageProps<"/admin/runs/[runId]/km/[memberId]">) {
  return (
    <Screen eyebrow="Admin" title="Enter km">
      <Card>
        <Suspense fallback={<p className="text-navy/60">Loading…</p>}>
          <AdminKmBody params={params} />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function AdminKmBody({ params }: Pick<PageProps<"/admin/runs/[runId]/km/[memberId]">, "params">) {
  const { runId, memberId } = await params;
  if (!isUuid(runId) || !isUuid(memberId)) notFound();
  const { supabase } = await requireAdmin(`/admin/runs/${runId}/km/${memberId}`);

  const [{ data: run }, { data: member }, { data: checkIn }, { data: log }] = await Promise.all([
    supabase.from("runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle<Run>(),
    supabase.from("profiles").select("full_name, display_name").eq("id", memberId).maybeSingle(),
    supabase.from("check_ins").select("id").eq("run_id", runId).eq("member_id", memberId).maybeSingle(),
    supabase
      .from("run_logs")
      .select("run_id, member_id, distance_km, duration_seconds")
      .eq("run_id", runId)
      .eq("member_id", memberId)
      .maybeSingle<RunLog>(),
  ]);
  if (!run || !member) notFound();
  const name = memberName(member);
  const back = `/admin/runs/${run.id}`;

  return (
    <div className="space-y-5">
      <div className="border-b border-navy/10 pb-4">
        <p className="font-display text-2xl font-bold uppercase leading-tight">{name}</p>
        <p className="text-navy/70">
          {run.title ?? "Saturday run"} · {formatRunDate(run.run_date)}
        </p>
      </div>

      {!checkIn ? (
        <>
          <Message tone="info">
            {name} isn&apos;t checked in to this run. Tick them off on the run page first, then add their km.
          </Message>
          <Link href={back} className="block text-sm text-sunrise-ink underline">
            Back to run day
          </Link>
        </>
      ) : (
        <>
          <Message tone="info">
            {log ? (
              <>
                {name} logged <strong>{Number(log.distance_km).toFixed(1)} km</strong>
                {log.duration_seconds ? ` in ${formatDuration(log.duration_seconds)}` : ""}. Change it below if
                it&apos;s wrong.
              </>
            ) : (
              <>{name} hasn&apos;t logged km for this run. Enter what they ran; it counts like any other log.</>
            )}
          </Message>
          <KmForm
            save={adminSaveKm.bind(null, run.id, memberId)}
            remove={adminRemoveKm.bind(null, run.id, memberId)}
            initialKm={Number(log?.distance_km ?? run.default_km)}
            initialSeconds={log?.duration_seconds ?? null}
            hasLog={!!log}
            labels={{ create: `Save ${name}'s km`, update: `Update ${name}'s km`, remove: "Remove their km" }}
            backHref={back}
            backLabel="Back to run day"
          />
        </>
      )}
    </div>
  );
}
