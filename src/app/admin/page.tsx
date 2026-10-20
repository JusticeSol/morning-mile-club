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
import { getRecentAnnouncements, isLive } from "@/lib/announcements";
import { formatPostedAt } from "@/lib/format";
import { AnnouncementForm } from "./announcement-form";
import { AnnouncementControls } from "./announcement-controls";

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
  const [goal, announcements] = await Promise.all([getGoalProgress(supabase), getRecentAnnouncements(supabase)]);

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
        <h2 id="announcements" className="mb-3 font-display text-xl font-bold uppercase">Announcement</h2>
        <AnnouncementForm />
        {announcements.length > 0 && (
          <ul className="mt-5 divide-y divide-navy/10 border-t border-navy/10">
            {announcements.map((a) => (
              <li key={a.id} className="space-y-2 py-3">
                <div>
                  <p className="font-medium">
                    {a.pinned && "📌 "}
                    {a.title}
                  </p>
                  <p className="line-clamp-2 text-sm text-navy/70">{a.body}</p>
                  <p className="text-xs text-navy/50">
                    {formatPostedAt(a.created_at)} · {isLive(a) ? "on the home page" : "expired"}
                  </p>
                </div>
                <AnnouncementControls id={a.id} pinned={a.pinned} />
              </li>
            ))}
          </ul>
        )}
      </Card>

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
