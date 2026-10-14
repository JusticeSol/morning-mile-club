import { Suspense } from "react";
import Link from "next/link";
import { Avatar, Card, Message, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { badgeIcon, sortBadges } from "@/lib/badge-meta";
import { formatDuration, formatRunDate, memberName } from "@/lib/format";
import { kmWindow } from "@/lib/km-window";
import { STATS_COLUMNS, type MemberStats, type Milestone, type RunStatus } from "@/lib/types";
import { signOut } from "../actions";

export default function ProfilePage({ searchParams }: PageProps<"/profile">) {
  return (
    <Screen eyebrow="Morning Mile Club" title="Profile" nav="profile">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <ProfileBody searchParams={searchParams} />
      </Suspense>
    </Screen>
  );
}

type RecentRun = {
  run_id: string;
  method: "qr" | "admin";
  runs: { run_date: string; title: string | null; status: RunStatus; checkin_closes_at: string };
};

async function ProfileBody({ searchParams }: Pick<PageProps<"/profile">, "searchParams">) {
  const { saved, km } = await searchParams;
  const { supabase, user, profile } = await requireMember("/profile");

  const [{ data: statsRow }, { data: milestones }, { data: earned }, { data: recent }] = await Promise.all([
    supabase.from("member_stats").select(STATS_COLUMNS).eq("member_id", user.id).maybeSingle<MemberStats>(),
    supabase.from("milestones").select("id, code, name, description, kind, threshold").order("threshold"),
    supabase.from("member_milestones").select("milestone_id, earned_at").eq("member_id", user.id),
    supabase
      .from("check_ins")
      .select("run_id, method, runs(run_date, title, status, checkin_closes_at)")
      .eq("member_id", user.id)
      .order("checked_in_at", { ascending: false })
      .limit(5),
  ]);
  const recentRuns = (recent ?? []) as unknown as RecentRun[];

  const { data: logs } = recentRuns.length
    ? await supabase
        .from("run_logs")
        .select("run_id, distance_km, duration_seconds")
        .eq("member_id", user.id)
        .in("run_id", recentRuns.map((r) => r.run_id))
    : { data: [] };
  const logBy = new Map((logs ?? []).map((l) => [l.run_id as string, l]));

  const stats = {
    saturdays: Number(statsRow?.saturdays_attended ?? 0),
    km: Number(statsRow?.total_km ?? 0),
    longestRun: statsRow?.longest_run_km != null ? Number(statsRow.longest_run_km) : null,
    streak: Number(statsRow?.current_streak ?? 0),
    bestStreak: Number(statsRow?.longest_streak ?? 0),
  };
  const earnedIds = new Set((earned ?? []).map((e) => e.milestone_id as string));
  // Special badges (Wake-Up Crew, Comeback Kid) have no progress bar.
  const progressFor = (m: Milestone) =>
    m.kind === "attendance" ? stats.saturdays : m.kind === "streak" ? stats.streak : m.kind === "distance" ? stats.km : null;

  return (
    <div className="space-y-4">
      {saved === "log" && (
        <Message tone="info">
          Run logged{typeof km === "string" && ` — ${Number(km).toFixed(1)} km`}. Nice work! 🎉
        </Message>
      )}
      {saved === "profile" && <Message tone="info">Profile updated.</Message>}

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={profile.display_name || profile.full_name} size="lg" me />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-3xl font-bold uppercase leading-none">{memberName(profile)}</p>
            <p className="truncate text-navy/60">{profile.full_name}</p>
            <p className="mt-1 text-sm">
              <span className="rounded-full bg-teal/10 px-2 py-0.5 font-semibold capitalize text-teal">
                {profile.pace_group ?? "steady"}
              </span>
              {profile.role === "admin" && (
                <span className="ml-2 rounded-full bg-navy/10 px-2 py-0.5 font-semibold">Admin</span>
              )}
            </p>
          </div>
        </div>
        <Link href="/profile/edit" className="mt-4 block text-sm font-medium text-sunrise-ink underline">
          Edit profile
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Current streak" value={`🔥 ${stats.streak}`} hint={`Best: ${stats.bestStreak}`} />
        <Stat label="Saturdays" value={String(stats.saturdays)} />
        <Stat label="Total km" value={stats.km.toFixed(1)} />
        <Stat label="Longest run" value={stats.longestRun != null ? `${stats.longestRun.toFixed(1)}` : "—"} hint="km" />
      </div>

      <Card>
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Badges</h2>
        <ul className="grid grid-cols-3 gap-3">
          {sortBadges((milestones ?? []) as Milestone[]).map((m) => {
            const has = earnedIds.has(m.id);
            const progress = progressFor(m);
            const pct = progress == null ? null : Math.min(100, Math.round((progress / Number(m.threshold)) * 100));
            return (
              <li
                key={m.id}
                title={m.description ?? undefined}
                className={`flex flex-col items-center rounded-xl p-2 text-center ${has ? "bg-sunrise/10" : "bg-paper"}`}
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-full text-2xl ${
                    has ? "bg-sunrise" : "bg-navy/10 grayscale"
                  }`}
                  aria-hidden
                >
                  {badgeIcon(m)}
                </span>
                <span className={`mt-1 text-xs font-semibold leading-tight ${has ? "" : "text-navy/50"}`}>{m.name}</span>
                {has ? (
                  <span className="sr-only">Earned</span>
                ) : pct == null ? (
                  <span className="mt-1 text-[10px] leading-tight text-navy/50">{m.description}</span>
                ) : (
                  <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-navy/10" aria-label={`${pct}% there`}>
                    <span className="block h-full bg-teal" style={{ width: `${pct}%` }} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 font-display text-xl font-bold uppercase">Recent runs</h2>
        {recentRuns.length === 0 ? (
          <p className="text-navy/60">No runs yet. Scan the QR at the meetup on Saturday!</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {recentRuns.map((r) => {
              const log = logBy.get(r.run_id);
              const phase = kmWindow(r.runs).phase;
              return (
                <li key={r.run_id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.runs.title ?? "Saturday run"}</span>
                    <span className="block text-sm text-navy/60">{formatRunDate(r.runs.run_date)}</span>
                  </span>
                  {log ? (
                    <span className="text-right">
                      <span className="block font-display text-xl font-bold">{Number(log.distance_km).toFixed(1)} km</span>
                      <span className="block text-sm text-navy/60">
                        {log.duration_seconds ? formatDuration(log.duration_seconds) : ""}
                        {phase === "open" && (
                          <>
                            {log.duration_seconds ? " · " : ""}
                            <Link href={`/runs/${r.run_id}/log`} className="text-sunrise-ink underline">
                              Edit
                            </Link>
                          </>
                        )}
                      </span>
                    </span>
                  ) : r.runs.status === "cancelled" ? (
                    <span className="text-sm text-navy/50">Cancelled</span>
                  ) : phase === "open" ? (
                    <Link href={`/runs/${r.run_id}/log`} className="text-sm font-medium text-sunrise-ink underline">
                      Log km
                    </Link>
                  ) : phase === "before" ? (
                    <span className="text-sm text-navy/50">Log after the run</span>
                  ) : (
                    <span className="text-sm text-navy/50">No km logged</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        {profile.role === "admin" ? (
          <Link href="/admin" className="font-medium text-sunrise-ink underline">
            Admin
          </Link>
        ) : (
          <span />
        )}
        <form action={signOut}>
          <button className="text-navy/60 underline">Log out</button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-navy/60">{label}</p>
      <p className="font-display text-4xl font-bold leading-tight">{value}</p>
      {hint && <p className="text-xs text-navy/50">{hint}</p>}
    </div>
  );
}
