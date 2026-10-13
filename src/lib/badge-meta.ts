import type { Milestone } from "@/lib/types";

// Icons follow the Saturday route for attendance badges.
const ICONS: Record<string, string> = {
  att_1: "🏥",
  att_4: "⛪",
  att_7: "🛑",
  att_10: "📸",
  att_25: "🌅",
  att_52: "🏆",
  wake_up_crew: "⏰",
  comeback: "🔁",
};

export function badgeIcon(m: Pick<Milestone, "code" | "kind">) {
  return ICONS[m.code] ?? (m.kind === "streak" ? "🔥" : m.kind === "distance" ? "🏃" : "🏅");
}

const KIND_ORDER = { attendance: 0, streak: 1, distance: 2, special: 3 } as const;

// Group badges by kind, then by threshold within each kind.
export function sortBadges<T extends Pick<Milestone, "kind" | "threshold">>(badges: T[]) {
  return [...badges].sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || Number(a.threshold) - Number(b.threshold),
  );
}
