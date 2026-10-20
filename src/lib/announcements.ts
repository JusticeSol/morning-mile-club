import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
};

const COLUMNS = "id, title, body, pinned, created_at";

// Unpinned announcements show on the home page for this many days.
export const ANNOUNCEMENT_DAYS = 7;

// Home page: pinned ones (until an admin unpins them) plus anything posted
// in the last week, newest first.
export async function getHomeAnnouncements(supabase: Supabase): Promise<Announcement[]> {
  const since = new Date(Date.now() - ANNOUNCEMENT_DAYS * 86_400_000).toISOString();
  const { data } = await supabase
    .from("announcements")
    .select(COLUMNS)
    .or(`pinned.eq.true,created_at.gte."${since}"`)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);
  return (data ?? []) as Announcement[];
}

// Admin list: the most recent ones, live or expired.
export async function getRecentAnnouncements(supabase: Supabase): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Announcement[];
}

// Whether an announcement is still on members' home pages.
export function isLive(a: Announcement) {
  return a.pinned || Date.parse(a.created_at) > Date.now() - ANNOUNCEMENT_DAYS * 86_400_000;
}
