import { Suspense } from "react";
import Link from "next/link";
import { Card, Screen, StatusPill } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatRunDate, nextSaturday } from "@/lib/format";
import type { RunStatus } from "@/lib/types";
import { NewRunForm } from "./new-run-form";
import { GoalForm } from "./goal-form";
import { GoalCard } from "@/components/goal-card";
import { currentMonth, getGoalProgress } from "@/lib/goal";

type RecapRow = {
  run_id: string;
  run_date: string;
  title: string | null;
  status: RunStatus;
  turnout: number;
  club_km: number;
};

export default function AdminPage() {
  return (
    <Screen eyebrow="Admin" title="Runs">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <AdminBody />
      </Suspense>
    </Screen>
  );
}

async function AdminBody() {
  const { supabase } = await requireAdmin("/admin");

  const { data } = await supabase
    .from("run_recap")
    .select("run_id, run_date, title, status, turnout, club_km")
    .order("run_date", { ascending: false })
    .limit(20);
  const runs = data as RecapRow[] | null;
  const goal = await getGoalProgress(supabase);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 font-display text-xl font-bold uppercase">New run</h2>
        <NewRunForm defaultDate={nextSaturday()} />
      </Card>

      <section id="goal" className="space-y-3">
        {goal && <GoalCard goal={goal} />}
        <Card>
          <h2 className="mb-3 font-display text-xl font-bold uppercase">Club goal</h2>
          <GoalForm month={currentMonth().start.slice(0, 7)} name={goal?.name} targetKm={goal?.targetKm} />
        </Card>
      </section>

      <Card>
        <h2 className="mb-1 font-display text-xl font-bold uppercase">All runs</h2>
        {runs?.length ? (
          <ul className="divide-y divide-navy/10">
            {runs.map((run) => (
              <li key={run.run_id}>
                <Link href={`/admin/runs/${run.run_id}`} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block font-medium">{run.title ?? "Saturday run"}</span>
                    <span className="block text-sm text-navy/60">{formatRunDate(run.run_date)}</span>
                  </span>
                  <span className="text-right text-sm">
                    <StatusPill status={run.status} />
                    <span className="mt-1 block text-navy/60">
                      {run.turnout} in · {Number(run.club_km)} km
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-navy/60">No runs yet. Create the first one above.</p>
        )}
      </Card>

      <Link href="/" className="block text-sm text-sunrise-ink underline">
        Back to home
      </Link>
    </div>
  );
}
