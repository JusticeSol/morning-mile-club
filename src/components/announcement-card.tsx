import { formatPostedAt } from "@/lib/format";
import type { Announcement } from "@/lib/announcements";

// Home-page banner for admin announcements (rain cancellations, reminders).
export function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <section className="rounded-2xl border-l-4 border-sunrise bg-white p-5 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-widest text-sunrise-ink">
        {a.pinned ? "📌 Pinned" : "📣 Announcement"} · {formatPostedAt(a.created_at)}
      </p>
      <p className="font-display text-2xl font-bold uppercase leading-tight">{a.title}</p>
      <p className="mt-1 whitespace-pre-line text-navy/80">{a.body}</p>
    </section>
  );
}
