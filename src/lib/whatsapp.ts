// Ready-to-paste WhatsApp messages for the admins (the early-morning crew).
// Plain text with emoji; *bold* is WhatsApp's own formatting.

import { saturdayRoute } from "@/lib/route";

export function buildReminder({
  title,
  when,
  startTime,
  site,
  coming = 0,
}: {
  title: string;
  when: string; // "today" or "Saturday 18 October"
  startTime: string;
  site: string;
  coming?: number; // members who tapped "I'm in"
}) {
  const [meet, start, anthony, maryland, back, finish] = saturdayRoute(startTime);
  return [
    `Good morning, Morning Mile Club! 🌅`,
    ``,
    `*${title}* is ${when}.`,
    `${meet.icon} Meet at ${meet.place}, ${meet.time} AM`,
    `${start.icon} We stroll to ${start.place} and start running at ${start.time}`,
    `${anthony.icon} ${anthony.place} (5-min break) → ${maryland.icon} ${maryland.place} → ${back.icon} back to ${back.place} → ${finish.icon} ${finish.place} for the final group picture, coffee and refreshments`,
    ...(coming > 0 ? [``, `💪 ${coming} runner${coming === 1 ? " has" : "s have"} said they're in. Join them!`] : []),
    ``,
    `✅ When you arrive, open ${site} and tap *Scan* to check in.`,
    `See you there! 🏃`,
  ].join("\n");
}

export type RecapInput = {
  title: string;
  date: string; // "Saturday 18 October"
  runners: number;
  km: number;
  logged: number; // how many runners have logged km
  logDeadline: string | null; // "10:45" while km logging is open, else null
  firstTimers: string[];
  badges: { name: string; badge: string }[];
  streaks: { name: string; weeks: number }[];
  goal?: { name: string; km: number; targetKm: number } | null;
  site: string;
};

export function buildRecap(r: RecapInput) {
  const lines = [
    `🏁 *Morning Mile Club recap: ${r.title}* (${r.date})`,
    ``,
    `👟 ${r.runners} runner${r.runners === 1 ? "" : "s"} · ${r.km.toFixed(1)} km together`,
  ];
  if (r.firstTimers.length) lines.push(`👋 Welcome to our first-timer${r.firstTimers.length === 1 ? "" : "s"}: ${list(r.firstTimers)}!`);
  if (r.badges.length) {
    lines.push(``, `🏅 *New badges*`);
    for (const b of r.badges) lines.push(`• ${b.name}: ${b.badge}`);
  }
  if (r.streaks.length) {
    lines.push(``, `🔥 *On a streak:* ${r.streaks.map((s) => `${s.name} (${s.weeks} weeks)`).join(", ")}`);
  }
  if (r.goal) {
    const pct = Math.min(100, Math.round((r.goal.km / r.goal.targetKm) * 100));
    lines.push(
      ``,
      pct >= 100
        ? `🎯 *Club goal smashed:* ${r.goal.name}, ${r.goal.km.toFixed(0)} / ${r.goal.targetKm.toFixed(0)} km 🎉`
        : `🎯 *Club goal:* ${r.goal.name}, ${r.goal.km.toFixed(0)} / ${r.goal.targetKm.toFixed(0)} km (${pct}%)`,
    );
  }
  lines.push(``, `📸 Thanks for the Maryland Mall moments and the banter!`);
  const missing = r.runners - r.logged;
  if (missing > 0 && r.logDeadline) {
    lines.push(`📝 ${missing} of you haven't logged your km yet. Log it before ${r.logDeadline}: ${r.site}`);
  } else if (missing === 0) {
    lines.push(`📝 Everyone's logged their km 🙌 See the leaderboard: ${r.site}/leaderboard`);
  } else {
    lines.push(`🏆 See the leaderboard: ${r.site}/leaderboard`);
  }
  lines.push(``, `See you next Saturday at Gbagada General Hospital, 6:00 AM! 🌅`);
  return lines.join("\n");
}

// ["Ada", "Tunde", "Bola"] -> "Ada, Tunde and Bola"
function list(names: string[]) {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
