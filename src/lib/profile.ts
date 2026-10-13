import type { PaceGroup } from "@/lib/types";

const PACE_GROUPS: PaceGroup[] = ["easy", "steady", "fast"];

// Validates the shared profile form (onboarding and edit).
export function parseProfileForm(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pace = String(formData.get("pace_group") ?? "steady") as PaceGroup;

  if (fullName.length < 2) return { error: "Please enter your name." } as const;
  if (fullName.length > 80 || displayName.length > 40) return { error: "That name is too long." } as const;
  if (!PACE_GROUPS.includes(pace)) return { error: "Pick a pace group." } as const;

  return { values: { full_name: fullName, display_name: displayName || null, pace_group: pace } } as const;
}
