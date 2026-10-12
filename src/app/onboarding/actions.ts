"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

const PACE_GROUPS = ["easy", "steady", "fast"] as const;

export async function createProfile(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pace = String(formData.get("pace_group") ?? "steady");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (fullName.length < 2) return { error: "Please enter your name." };
  if (!PACE_GROUPS.includes(pace as (typeof PACE_GROUPS)[number])) return { error: "Pick a pace group." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      display_name: displayName || null,
      pace_group: pace,
      phone: user.phone ? `+${user.phone}` : null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("createProfile", error);
    return { error: "Couldn't save your profile. Please try again." };
  }

  redirect(next);
}
