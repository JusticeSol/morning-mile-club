import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Awards any milestones the member has newly reached and returns their names.
// Badges only count completed runs, so most land when an admin marks a run
// completed; calling this after a check-in or km log still catches the rest.
export async function awardBadges(supabase: SupabaseClient, memberId: string, runId: string) {
  const { data: earned, error } = await supabase.rpc("award_milestones", {
    p_member_id: memberId,
    p_run_id: runId,
  });
  if (error) {
    console.error("award_milestones", error);
    return [];
  }
  if (!earned?.length) return [];

  const ids = (earned as { milestone_id: string }[]).map((m) => m.milestone_id);
  const { data: rows } = await supabase.from("milestones").select("name").in("id", ids);
  return (rows ?? []).map((r) => r.name as string);
}
