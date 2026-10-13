"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { parseProfileForm } from "@/lib/profile";

export async function createProfile(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const next = safeNext(String(formData.get("next") ?? ""));
  const parsed = parseProfileForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, ...parsed.values, phone: user.phone ? `+${user.phone}` : null },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("createProfile", error);
    return { error: "Couldn't save your profile. Please try again." };
  }

  redirect(next);
}
