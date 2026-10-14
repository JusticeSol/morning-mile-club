"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// "I'm in" for an upcoming Saturday. RLS limits it to the member's own RSVP
// on a scheduled run whose check-in hasn't closed.
export async function setRsvp(runId: string, going: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = going
    ? await supabase
        .from("rsvps")
        .upsert({ run_id: runId, member_id: user.id }, { onConflict: "run_id,member_id", ignoreDuplicates: true })
    : await supabase.from("rsvps").delete().eq("run_id", runId).eq("member_id", user.id);

  if (error) {
    console.error("setRsvp", error);
    return { error: "Couldn't update that. Please try again." };
  }
  refresh();
  return {};
}
