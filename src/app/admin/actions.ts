"use server";

import { notFound, redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardBadges } from "@/lib/badges";
import { lagosToday } from "@/lib/format";
import type { RunStatus } from "@/lib/types";
import { parseKmForm } from "@/lib/km-input";
import type { KmFormState } from "@/components/km-form";
import { RUN_PHOTOS } from "@/lib/run-photo";

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

  // A run can't be completed before its day (it would count streaks early).
  if (status === "completed") {
    const { data: run } = await supabase.from("runs").select("run_date").eq("id", runId).maybeSingle();
    if (!run || run.run_date > lagosToday()) return;
  }
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

// Monthly club goal: one per month, admins can change it any time.
export async function setGoal(_prev: { error?: string; saved?: boolean }, formData: FormData) {
  const month = String(formData.get("month") ?? ""); // YYYY-MM from <input type="month">
  const name = String(formData.get("name") ?? "").trim();
  const target = Number(formData.get("target_km"));

  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Pick a month." };
  if (name.length < 2 || name.length > 60) return { error: "Give the goal a short name, e.g. Gbagada → Abuja." };
  if (!(target > 0 && target <= 99999)) return { error: "Target must be a number of km above 0." };

  const { supabase, user } = await adminClient();
  const { error } = await supabase
    .from("club_goals")
    .upsert(
      { month: `${month}-01`, name, target_km: Math.round(target * 10) / 10, created_by: user.id },
      { onConflict: "month" },
    );
  if (error) {
    console.error("setGoal", error);
    return { error: "Couldn't save the goal. Please try again." };
  }
  refresh();
  return { saved: true };
}

// Admin km override: add or fix a member's km at any time (forgot to log,
// dead phone, a typo). Only for members checked in to the run.
export async function adminSaveKm(
  runId: string,
  memberId: string,
  _prev: KmFormState,
  formData: FormData,
): Promise<KmFormState> {
  const parsed = parseKmForm(formData);
  if (!parsed.ok) return { status: "error", message: parsed.error };

  const { supabase } = await adminClient();
  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("id")
    .eq("run_id", runId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (!checkIn) return { status: "error", message: "Tick them off as present first, then add their km." };

  const { error } = await supabase.from("run_logs").upsert(
    {
      run_id: runId,
      member_id: memberId,
      distance_km: parsed.km,
      duration_seconds: parsed.seconds,
      logged_at: new Date().toISOString(),
    },
    { onConflict: "run_id,member_id" },
  );
  if (error) {
    console.error("adminSaveKm", error);
    return { status: "error", message: "Couldn't save the km. Please try again." };
  }
  await awardBadges(supabase, memberId, runId);
  redirect(`/admin/runs/${runId}`);
}

export async function adminRemoveKm(runId: string, memberId: string) {
  const { supabase } = await adminClient();
  await supabase.from("run_logs").delete().eq("run_id", runId).eq("member_id", memberId);
  redirect(`/admin/runs/${runId}`);
}

// Announcements: shown on members' home pages (pinned ones until unpinned,
// the rest for a week; see src/lib/announcements.ts).
export async function postAnnouncement(_prev: { error?: string; posted?: boolean }, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  if (title.length < 2 || title.length > 80) return { error: "Give it a short headline (up to 80 characters)." };
  if (body.length < 2 || body.length > 1000) return { error: "Write the message (up to 1,000 characters)." };

  const { supabase, user } = await adminClient();
  const { error } = await supabase.from("announcements").insert({ title, body, pinned, created_by: user.id });
  if (error) {
    console.error("postAnnouncement", error);
    return { error: "Couldn't post it. Please try again." };
  }
  refresh();
  return { posted: true };
}

export async function setAnnouncementPinned(id: string, pinned: boolean) {
  const { supabase } = await adminClient();
  const { error } = await supabase.from("announcements").update({ pinned }).eq("id", id);
  if (error) console.error("setAnnouncementPinned", error);
  refresh();
}

export async function deleteAnnouncement(id: string) {
  const { supabase } = await adminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) console.error("deleteAnnouncement", error);
  refresh();
}

// Photo of the week: one group photo per run. Posting a new one replaces
// the old (row and file). Without a new photo, just updates the caption.
export async function postRunPhoto(runId: string, formData: FormData): Promise<{ error?: string }> {
  const photo = formData.get("photo");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 140) || null;
  const { supabase, user } = await adminClient();
  const bucket = supabase.storage.from(RUN_PHOTOS);
  const { data: existing } = await supabase.from("run_photos").select("id, storage_path").eq("run_id", runId);

  if (!(photo instanceof File)) {
    if (!existing?.length) return { error: "Choose a photo first." };
    const { error } = await supabase.from("run_photos").update({ caption }).eq("run_id", runId);
    if (error) {
      console.error("postRunPhoto caption", error);
      return { error: "Couldn't save the caption. Please try again." };
    }
    refresh();
    return {};
  }

  if (photo.type !== "image/jpeg" || photo.size === 0 || photo.size > 1_000_000) {
    return { error: "That photo didn't work. Try a different one." };
  }
  const path = `${runId}/${Date.now()}.jpg`;
  const { error: uploadError } = await bucket.upload(path, photo, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (uploadError) {
    console.error("postRunPhoto upload", uploadError);
    return { error: "Couldn't upload the photo. Please try again." };
  }
  const { error } = await supabase
    .from("run_photos")
    .insert({ run_id: runId, uploaded_by: user.id, storage_path: path, caption });
  if (error) {
    console.error("postRunPhoto insert", error);
    await bucket.remove([path]);
    return { error: "Couldn't save the photo. Please try again." };
  }
  if (existing?.length) {
    await supabase.from("run_photos").delete().in("id", existing.map((p) => p.id));
    await bucket.remove(existing.map((p) => p.storage_path));
  }
  refresh();
  return {};
}

export async function removeRunPhoto(runId: string): Promise<{ error?: string }> {
  const { supabase } = await adminClient();
  const { data: existing } = await supabase.from("run_photos").select("id, storage_path").eq("run_id", runId);
  if (!existing?.length) return {};
  const { error } = await supabase.from("run_photos").delete().eq("run_id", runId);
  if (error) {
    console.error("removeRunPhoto", error);
    return { error: "Couldn't remove the photo. Please try again." };
  }
  await supabase.storage.from(RUN_PHOTOS).remove(existing.map((p) => p.storage_path));
  refresh();
  return {};
}
