"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardBadges } from "@/lib/badges";

export type LogState = { status: "idle" } | { status: "error"; message: string };

export async function saveLog(runId: string, _prev: LogState, formData: FormData): Promise<LogState> {
  const distance = Number(String(formData.get("distance_km") ?? "").replace(",", "."));
  const hours = Number(formData.get("hours") || 0);
  const minutes = Number(formData.get("minutes") || 0);

  if (!Number.isFinite(distance) || distance < 0.1 || distance > 60) {
    return { status: "error", message: "Distance must be between 0.1 and 60 km." };
  }
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
    return { status: "error", message: "Time should be whole hours and minutes (0–59)." };
  }
  const durationSeconds = (hours * 60 + minutes) * 60;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/runs/${runId}/log`)}`);

  const { error } = await supabase.from("run_logs").upsert(
    {
      run_id: runId,
      member_id: user.id,
      distance_km: Math.round(distance * 10) / 10,
      duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      logged_at: new Date().toISOString(),
    },
    { onConflict: "run_id,member_id" },
  );

  if (error) {
    // 42501 = blocked by RLS: no check-in for this run.
    if (error.code === "42501") {
      return { status: "error", message: "You need to be checked in to this run before logging km." };
    }
    console.error("saveLog", error);
    return { status: "error", message: "Couldn't save your run. Please try again." };
  }

  await awardBadges(supabase, user.id, runId);
  // Land on the profile so members see the km added to their totals.
  redirect(`/profile?saved=log&km=${Math.round(distance * 10) / 10}`);
}

export async function deleteLog(runId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("run_logs").delete().eq("run_id", runId).eq("member_id", user.id);
  refresh();
}
