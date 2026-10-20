import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { lagosToday } from "@/lib/format";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const RUN_PHOTOS = "run-photos";

// The home page shows the latest photo for this many days after its run.
const PHOTO_DAYS = 14;

export type RunPhoto = {
  id: string;
  url: string;
  caption: string | null;
  runDate: string;
  runTitle: string | null;
};

type Row = {
  id: string;
  storage_path: string;
  caption: string | null;
  runs: { run_date: string; title: string | null; status: string };
};

function toPhoto(supabase: Supabase, row: Row): RunPhoto {
  return {
    id: row.id,
    url: supabase.storage.from(RUN_PHOTOS).getPublicUrl(row.storage_path).data.publicUrl,
    caption: row.caption,
    runDate: row.runs.run_date,
    runTitle: row.runs.title,
  };
}

// Photo of the week: the newest photo from a recent, non-cancelled run.
export async function getPhotoOfTheWeek(supabase: Supabase): Promise<RunPhoto | null> {
  const since = new Date(`${lagosToday()}T12:00:00Z`);
  since.setUTCDate(since.getUTCDate() - PHOTO_DAYS);
  const { data } = await supabase
    .from("run_photos")
    .select("id, storage_path, caption, runs!inner(run_date, title, status)")
    .gte("runs.run_date", since.toISOString().slice(0, 10))
    .neq("runs.status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toPhoto(supabase, data as unknown as Row) : null;
}

// Admin run page: this run's photo, if posted.
export async function getRunPhoto(supabase: Supabase, runId: string): Promise<RunPhoto | null> {
  const { data } = await supabase
    .from("run_photos")
    .select("id, storage_path, caption, runs!inner(run_date, title, status)")
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toPhoto(supabase, data as unknown as Row) : null;
}
