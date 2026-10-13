import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Message, Screen } from "@/components/ui";
import { WhatsAppMessage } from "@/components/whatsapp-message";
import { requireAdmin } from "@/lib/auth";
import { formatRunDate, lagosToday, memberName } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { RUN_COLUMNS, type Run } from "@/lib/types";
import { isUuid } from "@/lib/uuid";
import { buildRecap, buildReminder } from "@/lib/whatsapp";

// Separate from the run-day page on purpose: that page auto-refreshes,
// which would wipe edits to these messages.
export default function WhatsAppPage({ params }: PageProps<"/admin/runs/[runId]/whatsapp">) {
  return (
    <Screen eyebrow="Admin" title="WhatsApp">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <WhatsAppBody params={params} />
      </Suspense>
    </Screen>
  );
}

type Named = { id: string; full_name: string; display_name: string | null };

async function WhatsAppBody({ params }: Pick<PageProps<"/admin/runs/[runId]/whatsapp">, "params">) {
  const { runId } = await params;
  if (!isUuid(runId)) notFound();
  const { supabase } = await requireAdmin(`/admin/runs/${runId}/whatsapp`);

  const [{ data: run }, { data: checkIns }, { data: logs }, { data: earned }] = await Promise.all([
    supabase.from("runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle<Run>(),
    supabase.from("check_ins").select("member_id, profiles(id, full_name, display_name)").eq("run_id", runId),
    supabase.from("run_logs").select("member_id, distance_km").eq("run_id", runId),
    supabase.from("member_milestones").select("member_id, milestones(name)").eq("run_id", runId),
  ]);
  if (!run) notFound();

  const runners = ((checkIns ?? []) as unknown as { member_id: string; profiles: Named }[]).map((c) => c.profiles);
  const ids = runners.map((r) => r.id);
  const nameOf = new Map(runners.map((r) => [r.id, memberName(r)]));

  // First-timers: no check-in at any earlier run. Streaks only make sense
  // once this run is completed.
  const [{ data: earlier }, { data: streakRows }] = ids.length
    ? await Promise.all([
        supabase
          .from("check_ins")
          .select("member_id, runs!inner(run_date)")
          .in("member_id", ids)
          .lt("runs.run_date", run.run_date),
        run.status === "completed"
          ? supabase
              .from("member_stats")
              .select("member_id, current_streak")
              .in("member_id", ids)
              .gte("current_streak", 2)
              .order("current_streak", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }];
  const returning = new Set((earlier ?? []).map((e) => e.member_id as string));

  const site = await siteUrl();
  const title = run.title ?? "Saturday run";
  const when = run.run_date === lagosToday() ? "today" : `on ${formatRunDate(run.run_date)}`;

  const reminder = buildReminder({ title, when, startTime: run.start_time, site });
  const recap = buildRecap({
    title,
    date: formatRunDate(run.run_date),
    runners: runners.length,
    km: (logs ?? []).reduce((sum, l) => sum + Number(l.distance_km), 0),
    logged: (logs ?? []).length,
    firstTimers: runners.filter((r) => !returning.has(r.id)).map((r) => memberName(r)),
    badges: ((earned ?? []) as unknown as { member_id: string; milestones: { name: string } }[]).map((b) => ({
      name: nameOf.get(b.member_id) ?? "Someone",
      badge: b.milestones.name,
    })),
    streaks: (streakRows ?? []).map((s) => ({
      name: nameOf.get(s.member_id as string) ?? "Someone",
      weeks: Number(s.current_streak),
    })),
    site,
  });

  return (
    <div className="space-y-4">
      <Card>
        <p className="font-display text-2xl font-bold uppercase leading-tight">{title}</p>
        <p className="text-navy/70">{formatRunDate(run.run_date)}</p>
      </Card>

      <Card>
        <WhatsAppMessage
          title="Morning reminder"
          hint="Post before 6 AM. Edit anything you like before sending."
          text={reminder}
        />
      </Card>

      <Card>
        {runners.length === 0 ? (
          <>
            <h3 className="font-display text-lg font-bold uppercase">Post-run recap</h3>
            <Message tone="info">The recap appears once people have checked in.</Message>
          </>
        ) : (
          <WhatsAppMessage
            title="Post-run recap"
            hint={
              run.status === "completed"
                ? "Badges and streaks are final. Best posted after most people have logged their km."
                : "Streaks and Saturday badges appear once check-in closes (8:45)."
            }
            text={recap}
          />
        )}
      </Card>

      <Link href={`/admin/runs/${run.id}`} className="block text-sm text-sunrise-ink underline">
        Back to run day
      </Link>
    </div>
  );
}
