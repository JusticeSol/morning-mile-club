"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProfileForm } from "@/lib/profile";

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
