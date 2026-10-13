// Ready-to-paste WhatsApp messages for the admins (the early-morning crew).
// Plain text with emoji; *bold* is WhatsApp's own formatting.

import { saturdayRoute } from "@/lib/route";

export function buildReminder({
  title,
  when,
  startTime,
  site,
}: {
  title: string;
  when: string; // "today" or "Saturday 18 October"
  startTime: string;
  site: string;
}) {
  const [meet, start, anthony, maryland, back, finish] = saturdayRoute(startTime);
  return [
    `Good morning, Morning Mile Club! 🌅`,
    ``,
    `*${title}* is ${when}.`,
    `${meet.icon} Meet at ${meet.place}, ${meet.time} AM`,
    `${start.icon} We stroll to ${start.place} and start running at ${start.time}`,
    `${anthony.icon} ${anthony.place} (5-min break) → ${maryland.icon} ${maryland.place} → ${back.icon} back to ${back.place} → ${finish.icon} ${finish.place} for the final group picture, coffee and refreshments`,
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
  firstTimers: string[];
  badges: { name: string; badge: string }[];
  streaks: { name: string; weeks: number }[];
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
  lines.push(``, `📸 Thanks for the Maryland Mall moments and the banter!`);
  const missing = r.runners - r.logged;
  lines.push(
    missing > 0
      ? `📝 ${missing} of you haven't logged your km yet. Log it here: ${r.site}`
      : `📝 Everyone's logged their km 🙌 See the leaderboard: ${r.site}/leaderboard`,
  );
  lines.push(``, `See you next Saturday at Gbagada General Hospital, 6:00 AM! 🌅`);
  return lines.join("\n");
}

// ["Ada", "Tunde", "Bola"] -> "Ada, Tunde and Bola"
function list(names: string[]) {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
