"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { awardBadges } from "@/lib/badges";
import type { CheckIn } from "@/lib/types";

export type CheckInState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; checkedInAt: string; badges: string[] };

// check_in() reports problems with `raise exception '<text>'`; turn those
// into something friendlier for a phone screen at 6:30 AM.
const FRIENDLY: Record<string, string> = {
  "Please log in first": "Your login expired. Please log in again.",
  "Run not found": "We couldn't find this run.",
  "This run was cancelled": "This run was cancelled. See you next Saturday!",
  "Invalid check-in code": "This QR code isn't valid for this run. Scan the code shown at the meetup.",
  "Check-in is closed for this run": "Check-in is only open 6:00–8:20 AM on run day.",
};

export async function checkIn(runId: string, code: string): Promise<CheckInState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/checkin/${runId}?code=${encodeURIComponent(code)}`)}`);
  }

  const { data, error } = await supabase
    .rpc("check_in", { p_run_id: runId, p_code: code })
    .single<CheckIn>();

  if (error || !data) {
    const message = error && FRIENDLY[error.message];
    if (!message) console.error("check_in failed", error);
    return { status: "error", message: message ?? "Something went wrong. Please try again." };
  }

  const badges = await awardBadges(supabase, user.id, runId);

  return { status: "done", checkedInAt: data.checked_in_at, badges };
}
