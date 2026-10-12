import { Suspense } from "react";
import { Card, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { formatClockTime, formatRunDate, memberName } from "@/lib/format";
import type { Run } from "@/lib/types";
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
  const { supabase, profile } = await requireMember("/");

  // run_date is a plain date; compare against today's date in Lagos.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
  const { data: nextRun } = await supabase
    .from("runs")
    .select("id, run_date, title, default_km, start_time, status, checkin_opens_at, checkin_closes_at")
    .gte("run_date", today)
    .neq("status", "cancelled")
    .order("run_date")
    .limit(1)
    .maybeSingle<Run>();

  return (
    <div className="space-y-4">
      <p className="text-lg">
        Hi <strong>{memberName(profile)}</strong> 👋
      </p>
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
      <form action={signOut}>
        <button className="text-sm text-navy/60 underline">Log out</button>
      </form>
    </div>
  );
}
