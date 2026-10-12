import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { AutoRefresh } from "@/components/auto-refresh";
import { Message } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatRunDate, formatTime } from "@/lib/format";
import { RUN_COLUMNS, type Run } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { KeepAwake } from "./keep-awake";

// Full-screen QR for the organiser's phone at the meetup. Plain black on
// white and as large as the screen allows, so it scans in bright sunlight.
export default function QrPage({ params }: PageProps<"/admin/runs/[runId]/qr">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-6 text-navy">
      <Suspense fallback={<p className="text-navy/60">Loading QR…</p>}>
        <QrBody params={params} />
      </Suspense>
    </main>
  );
}

async function QrBody({ params }: Pick<PageProps<"/admin/runs/[runId]/qr">, "params">) {
  const { runId } = await params;
  if (!isUuid(runId)) notFound();
  const { supabase } = await requireAdmin(`/admin/runs/${runId}/qr`);

  const [{ data: run }, { data: codeRow }, { count }] = await Promise.all([
    supabase.from("runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle<Run>(),
    supabase.from("run_checkin_codes").select("code").eq("run_id", runId).maybeSingle(),
    supabase.from("check_ins").select("id", { count: "exact", head: true }).eq("run_id", runId),
  ]);
  if (!run || !codeRow) notFound();

  const url = `${await siteUrl()}/checkin/${run.id}?code=${encodeURIComponent(codeRow.code)}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
      <AutoRefresh seconds={10} />
      <KeepAwake />
      <div>
        <p className="font-display text-3xl font-bold uppercase leading-none">Scan to check in</p>
        <p className="text-navy/70">
          {run.title ?? "Saturday run"} · {formatRunDate(run.run_date)}
        </p>
      </div>

      {run.status !== "scheduled" && (
        <Message tone="error">This run is {run.status}, so check-in won&apos;t work.</Message>
      )}

      {/* Generated locally from our own URL, so the SVG is safe to inline. */}
      <div
        className="aspect-square w-[min(92vw,62vh)] [&>svg]:size-full"
        role="img"
        aria-label="Check-in QR code"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p className="font-display text-5xl font-bold">
        {count ?? 0} <span className="text-2xl uppercase text-navy/60">checked in</span>
      </p>
      <p className="text-sm text-navy/60">
        Open {formatTime(run.checkin_opens_at)}–{formatTime(run.checkin_closes_at)}. Turn your brightness up.
      </p>
      <Link href={`/admin/runs/${run.id}`} className="text-sm text-sunrise-ink underline">
        Back to tick-off list
      </Link>
    </div>
  );
}

// The QR must point at the public site, not localhost behind a proxy.
// Set NEXT_PUBLIC_SITE_URL in production; otherwise use the request's host.
async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
