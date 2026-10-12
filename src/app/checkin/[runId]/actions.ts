"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  "Check-in is closed for this run": "Check-in is only open 6:00–8:45 AM on run day.",
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

  // Badges only count completed runs, so most land once an admin closes the
  // run; awarding here still catches anything already reached.
  const { data: earned } = await supabase.rpc("award_milestones", {
    p_member_id: user.id,
    p_run_id: runId,
  });
  let badges: string[] = [];
  if (earned?.length) {
    const ids = (earned as { milestone_id: string }[]).map((m) => m.milestone_id);
    const { data: rows } = await supabase.from("milestones").select("name").in("id", ids);
    badges = (rows ?? []).map((r) => r.name as string);
  }

  return { status: "done", checkedInAt: data.checked_in_at, badges };
}
