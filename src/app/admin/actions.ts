"use server";

import { notFound, redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardBadges } from "@/lib/badges";
import type { RunStatus } from "@/lib/types";

// Server actions are public endpoints, so each one re-checks the caller.
// RLS (is_admin()) enforces the same rule in the database.
async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") notFound();
  return { supabase, user };
}

export async function createRun(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const runDate = String(formData.get("run_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const defaultKm = Number(formData.get("default_km") || 12);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) return { error: "Pick a date." };
  if (!(defaultKm > 0 && defaultKm <= 60)) return { error: "Distance must be between 0.5 and 60 km." };

  const { supabase, user } = await adminClient();
  const { data, error } = await supabase
    .from("runs")
    .insert({
      run_date: runDate,
      title: title || null,
      default_km: defaultKm,
      notes: notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "There's already a run on that date." };
    console.error("createRun", error);
    return { error: "Couldn't create the run. Please try again." };
  }
  redirect(`/admin/runs/${data.id}`);
}

export async function setRunStatus(runId: string, status: RunStatus) {
  const { supabase } = await adminClient();
  const { error } = await supabase.from("runs").update({ status }).eq("id", runId);
  if (error) {
    console.error("setRunStatus", error);
    return;
  }

  // Streaks and attendance badges only count completed runs, so this is
  // the moment most badges are earned.
  if (status === "completed") {
    const { data: attendees } = await supabase.from("check_ins").select("member_id").eq("run_id", runId);
    for (const { member_id } of attendees ?? []) {
      await awardBadges(supabase, member_id, runId);
    }
  }
  refresh();
}

// Tick-off list: mark a member present (method 'admin') or remove a check-in.
export async function setAttendance(runId: string, memberId: string, present: boolean) {
  const { supabase } = await adminClient();

  const { error } = present
    ? await supabase
        .from("check_ins")
        .upsert(
          { run_id: runId, member_id: memberId, method: "admin" },
          { onConflict: "run_id,member_id", ignoreDuplicates: true },
        )
    : await supabase.from("check_ins").delete().eq("run_id", runId).eq("member_id", memberId);

  if (error) {
    console.error("setAttendance", error);
    return { error: "Couldn't update attendance. Please try again." };
  }

  if (present) {
    // Only matters once the run is completed; harmless before then.
    await awardBadges(supabase, memberId, runId);
  }
  refresh();
  return {};
}
