import { Card } from "@/components/ui";
import type { GoalProgress } from "@/lib/goal";

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

export function GoalCard({ goal }: { goal: GoalProgress }) {
  const pct = Math.min(100, Math.round((goal.km / goal.targetKm) * 100));
  const left = Math.max(0, goal.targetKm - goal.km);
  const done = left === 0;
  const month = MONTH.format(new Date(`${goal.month}T12:00:00Z`));

  return (
    <Card>
      <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">{month} club goal</p>
      <p className="font-display text-2xl font-bold uppercase leading-tight">{goal.name}</p>
      <div
        className="my-3 h-4 overflow-hidden rounded-full bg-paper"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% of the club goal`}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-sunrise to-sunrise-ink" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-baseline justify-between">
        <p>
          <span className="font-hand text-3xl">{goal.km.toFixed(1)}</span>
          <span className="text-navy/60"> / {goal.targetKm.toFixed(0)} km</span>
        </p>
        <p className="font-display text-xl font-bold text-sunrise-ink">{pct}%</p>
      </div>
      <p className="mt-1 text-sm text-navy/60">
        {done
          ? "Goal reached! 🎉 Every km from here is a bonus."
          : `${left.toFixed(1)} km to go · ${goal.daysLeft} day${goal.daysLeft === 1 ? "" : "s"} left. Every km you log counts.`}
      </p>
    </Card>
  );
}
