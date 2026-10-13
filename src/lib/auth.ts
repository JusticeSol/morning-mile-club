import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Only allow same-site relative paths as post-login destinations.
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

// Marks runs completed once check-in has closed, so streaks and badges
// count even when no admin taps "Mark completed". Usually updates nothing.
// Never blocks the page: a failure is logged and ignored.
async function completePastRuns(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.rpc("complete_past_runs");
  if (error) console.error("complete_past_runs", error.message);
}

// Returns the signed-in member and their profile. Sends them to /login if
// signed out, or to /onboarding if they haven't created a profile yet.
// `next` is where to come back to afterwards.
export async function requireMember(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const [{ data: profile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, display_name, avatar_url, pace_group, role")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    completePastRuns(supabase),
  ]);

  if (!profile) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user, profile };
}

// Same as requireMember, but non-admins get a 404 so the admin pages
// don't advertise themselves. RLS still guards every admin write.
export async function requireAdmin(next: string) {
  const member = await requireMember(next);
  if (member.profile.role !== "admin") notFound();
  return member;
}
