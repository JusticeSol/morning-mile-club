"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseProfileForm } from "@/lib/profile";

const AVATARS = "avatars";

// Profile photo. The browser has already shrunk it to a 512×512 JPEG
// (photo-upload.tsx), so it's well under the 1 MB server-action limit.
export async function uploadPhoto(formData: FormData): Promise<{ error?: string }> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.type !== "image/jpeg" || photo.size === 0 || photo.size > 1_000_000) {
    return { error: "That photo didn't work. Try a different one." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  // A new file name each time, so phones don't keep showing a cached old photo.
  const path = `${user.id}/${Date.now()}.jpg`;
  const storage = supabase.storage.from(AVATARS);
  const { error } = await storage.upload(path, photo, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) {
    console.error("uploadPhoto", error);
    return { error: "Couldn't upload the photo. Please try again." };
  }

  const { error: saveError } = await supabase
    .from("profiles")
    .update({ avatar_url: storage.getPublicUrl(path).data.publicUrl })
    .eq("id", user.id);
  if (saveError) {
    console.error("uploadPhoto", saveError);
    return { error: "Couldn't save the photo. Please try again." };
  }
  await removeOldPhotos(supabase, user.id, path);
  refresh();
  return {};
}

export async function removePhoto(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) {
    console.error("removePhoto", error);
    return { error: "Couldn't remove the photo. Please try again." };
  }
  await removeOldPhotos(supabase, user.id);
  refresh();
  return {};
}

// Deletes the member's stored photos except `keep`.
async function removeOldPhotos(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, keep?: string) {
  const storage = supabase.storage.from(AVATARS);
  const { data: files } = await storage.list(userId);
  const old = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await storage.remove(old);
}

// "Hide me from the leaderboard" switch on the profile page.
export async function setLeaderboardHidden(hidden: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { error } = await supabase.from("profiles").update({ hide_from_leaderboard: hidden }).eq("id", user.id);
  if (error) console.error("setLeaderboardHidden", error);
  refresh();
}

export async function updateProfile(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const parsed = parseProfileForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/edit");

  // RLS ("update own profile") stops members changing anyone else, or their role.
  const { error } = await supabase.from("profiles").update(parsed.values).eq("id", user.id);
  if (error) {
    console.error("updateProfile", error);
    return { error: "Couldn't save your profile. Please try again." };
  }

  redirect("/profile?saved=profile");
}
