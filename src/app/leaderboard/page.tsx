import { Suspense } from "react";
import Link from "next/link";
import { Avatar, Card, Screen } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { memberName } from "@/lib/format";
import { STATS_COLUMNS, type MemberStats, type PaceGroup } from "@/lib/types";

const PACES: PaceGroup[] = ["easy", "steady", "fast"];

// Only club-created data (QR check-ins and self-logged km) feeds this
// board; never Strava data. See CLAUDE.md.
const BOARDS = {
  distance: {
    label: "Distance",
    value: (s: MemberStats) => Number(s.total_km),
    show: (s: MemberStats) => `${Number(s.total_km).toFixed(1)} km`,
    empty: "No km logged yet. Log your first run after Saturday!",
  },
  attendance: {
    label: "Attendance",
    value: (s: MemberStats) => Number(s.saturdays_attended),
    show: (s: MemberStats) => plural(Number(s.saturdays_attended), "Saturday"),
    empty: "No completed Saturdays yet.",
  },
  streaks: {
    label: "Streaks",
    // Current streak first; best-ever streak breaks ties.
    value: (s: MemberStats) => Number(s.current_streak) * 1000 + Number(s.longest_streak),
    show: (s: MemberStats) => `🔥 ${Number(s.current_streak)}`,
    empty: "No active streaks yet. Show up two Saturdays in a row!",
  },
} as const;
type Board = keyof typeof BOARDS;

const TOP = 50;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  return (
    <Screen eyebrow="Morning Mile Club" title="Leaderboard" nav="board">
      <Suspense fallback={<Card><p className="text-navy/60">Loading…</p></Card>}>
        <LeaderboardBody searchParams={searchParams} />
      </Suspense>
    </Screen>
  );
}

async function LeaderboardBody({ searchParams }: Pick<PageProps<"/leaderboard">, "searchParams">) {
  const { tab, pace: paceParam } = await searchParams;
  const board: Board = tab === "attendance" || tab === "streaks" ? tab : "distance";
  const pace = PACES.find((p) => p === paceParam) ?? null;
  const href = (b: Board, p: PaceGroup | null) => `/leaderboard?tab=${b}${p ? `&pace=${p}` : ""}`;
  const { supabase, user, profile } = await requireMember(href(board, pace));
  const { value, show, empty } = BOARDS[board];

  const { data } = await supabase.from("member_stats").select(STATS_COLUMNS);
  const ranked = rank(
    ((data ?? []) as MemberStats[]).filter((s) => value(s) > 0 && (!pace || s.pace_group === pace)),
    value,
  );
  const mine = ranked.find((r) => r.stats.member_id === user.id);
  const top = ranked.slice(0, TOP);

  return (
    <div className="space-y-4">
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-sm">
        {(Object.keys(BOARDS) as Board[]).map((b) => (
          <Link
            key={b}
            href={href(b, pace)}
            role="tab"
            aria-selected={b === board}
            className={`rounded-lg py-2 text-center font-display text-lg font-bold uppercase ${
              b === board ? "bg-navy text-white" : "text-navy/60"
            }`}
          >
            {BOARDS[b].label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2" aria-label="Pace group">
        {([null, ...PACES] as (PaceGroup | null)[]).map((p) => (
          <Link
            key={p ?? "all"}
            href={href(board, p)}
            aria-current={p === pace ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${
              p === pace ? "bg-sunrise text-white" : "bg-white text-navy/70 shadow-sm"
            }`}
          >
            {p ?? "Everyone"}
          </Link>
        ))}
      </div>

      <Card>
        {top.length === 0 ? (
          <p className="text-navy/60">{pace ? `Nobody in the ${pace} group is on this board yet.` : empty}</p>
        ) : (
          <ol className="divide-y divide-navy/10">
            {top.map((r) => (
              <Row key={r.stats.member_id} rank={r.rank} stats={r.stats} value={show(r.stats)} me={r.stats.member_id === user.id} />
            ))}
          </ol>
        )}
      </Card>

      {/* Keep your own position in view when you're outside the top list. */}
      {mine && mine.rank > TOP && (
        <Card>
          <ol>
            <Row rank={mine.rank} stats={mine.stats} value={show(mine.stats)} me />
          </ol>
        </Card>
      )}
      {!mine && top.length > 0 && (!pace || pace === profile.pace_group) && (
        <p className="text-center text-sm text-navy/60">You&apos;re not on this board yet. See you Saturday!</p>
      )}
      <p className="text-center text-xs text-navy/50">
        Counts check-ins and km logged on this site. A Saturday counts once it&apos;s completed, automatically after check-in closes at 8:45.
      </p>
    </div>
  );
}

// Standard competition ranking: ties share a rank (1, 2, 2, 4).
function rank(stats: MemberStats[], value: (s: MemberStats) => number) {
  const sorted = [...stats].sort((a, b) => value(b) - value(a) || a.full_name.localeCompare(b.full_name));
  return sorted.map((s, i) => {
    let r = i;
    while (r > 0 && value(sorted[r - 1]) === value(s)) r--;
    return { rank: r + 1, stats: s };
  });
}

function Row({ rank, stats, value, me }: { rank: number; stats: MemberStats; value: string; me: boolean }) {
  return (
    <li className={`flex items-center gap-3 py-3 ${me ? "-mx-2 rounded-xl bg-sunrise/10 px-2" : ""}`}>
      <span
        className={`w-7 text-center font-display text-xl font-bold ${rank <= 3 ? "text-sunrise-ink" : "text-navy/50"}`}
      >
        {rank}
      </span>
      <Avatar name={stats.display_name || stats.full_name} me={me} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {memberName(stats)}
          {me && <span className="text-navy/50"> (you)</span>}
        </span>
        {stats.pace_group && <span className="block text-sm capitalize text-navy/60">{stats.pace_group}</span>}
      </span>
      <span className="font-display text-xl font-bold">{value}</span>
    </li>
  );
}
