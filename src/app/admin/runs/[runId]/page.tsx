import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass, Card, Screen, StatusPill } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { requireAdmin } from "@/lib/auth";
import { formatClockTime, formatRunDate, formatTime, memberName } from "@/lib/format";
import { RUN_COLUMNS, type PaceGroup, type Run } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { AttendanceList, type AttendanceRow } from "./attendance-list";
import { RunControls } from "./run-controls";

export default function AdminRunPage({ params }: PageProps<"/admin/runs/[runId]">) {
  return (
    <Screen eyebrow="Admin" title="Run day">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <AdminRunBody params={params} />
      </Suspense>
    </Screen>
  );
}

async function AdminRunBody({ params }: Pick<PageProps<"/admin/runs/[runId]">, "params">) {
  const { runId } = await params;
  if (!isUuid(runId)) notFound();
  const { supabase } = await requireAdmin(`/admin/runs/${runId}`);

  const [{ data: run }, { data: members }, { data: checkIns }, { data: logs }, { count: comingCount }] = await Promise.all([
    supabase.from("runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle<Run>(),
    supabase.from("profiles").select("id, full_name, display_name, pace_group").order("full_name"),
    supabase.from("check_ins").select("member_id, method, checked_in_at").eq("run_id", runId),
    supabase.from("run_logs").select("member_id, distance_km").eq("run_id", runId),
    supabase.from("rsvps").select("run_id", { count: "exact", head: true }).eq("run_id", runId),
  ]);
  if (!run) notFound();

  const checkInBy = new Map((checkIns ?? []).map((c) => [c.member_id as string, c]));
  const kmBy = new Map((logs ?? []).map((l) => [l.member_id as string, Number(l.distance_km)]));

  const rows: AttendanceRow[] = (members ?? []).map((m) => {
    const c = checkInBy.get(m.id);
    return {
      id: m.id,
      name: m.display_name ? `${m.display_name} (${m.full_name})` : m.full_name,
      short: memberName(m),
      pace: m.pace_group as PaceGroup | null,
      method: c ? (c.method as "qr" | "admin") : null,
      at: c ? formatTime(c.checked_in_at) : null,
      km: kmBy.get(m.id) ?? null,
    };
  });
  const totalKm = [...kmBy.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <AutoRefresh seconds={15} />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-tight">{run.title ?? "Saturday run"}</p>
            <p className="text-navy/70">
              {formatRunDate(run.run_date)} · meet {formatClockTime(run.start_time)} · ~{run.default_km} km
            </p>
            <p className="text-sm text-navy/60">
              Check-in {formatTime(run.checkin_opens_at)}–{formatTime(run.checkin_closes_at)}
            </p>
          </div>
          <StatusPill status={run.status} />
        </div>

        <dl className="my-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-paper py-3">
            <dt className="text-xs font-medium uppercase tracking-widest text-navy/60">Said I&apos;m in</dt>
            <dd className="font-display text-3xl font-bold">{comingCount ?? 0}</dd>
          </div>
          <div className="rounded-xl bg-paper py-3">
            <dt className="text-xs font-medium uppercase tracking-widest text-navy/60">Checked in</dt>
            <dd className="font-display text-3xl font-bold">{checkInBy.size}</dd>
          </div>
          <div className="rounded-xl bg-paper py-3">
            <dt className="text-xs font-medium uppercase tracking-widest text-navy/60">Km logged</dt>
            <dd className="font-display text-3xl font-bold">{totalKm.toFixed(1)}</dd>
          </div>
        </dl>

        {run.status === "scheduled" && (
          <Link href={`/admin/runs/${run.id}/qr`} className={`${buttonClass} mb-3`}>
            Show QR code
          </Link>
        )}
        <RunControls runId={run.id} status={run.status} />
        <Link
          href={`/admin/runs/${run.id}/whatsapp`}
          className="mt-2 block rounded-xl bg-[#25D366]/10 px-4 py-3 text-center font-medium text-[#128C7E]"
        >
          WhatsApp reminder &amp; recap
        </Link>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold uppercase">Tick-off list</h2>
        <p className="mb-3 text-sm text-navy/60">
          Tap a name to mark them here (dead phone, no data, forgot to scan). QR check-ins show up automatically.
        </p>
        <AttendanceList runId={run.id} rows={rows} />
      </Card>

      <Link href="/admin" className="block text-sm text-sunrise-ink underline">
        All runs
      </Link>
    </div>
  );
}
