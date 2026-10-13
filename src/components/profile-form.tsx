"use client";

import { useActionState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import type { PaceGroup } from "@/lib/types";

const PACES = [
  { value: "easy", label: "Easy", hint: "Chatty pace" },
  { value: "steady", label: "Steady", hint: "Comfortably hard" },
  { value: "fast", label: "Fast", hint: "Up front" },
];

type ProfileAction = (prev: { error?: string }, formData: FormData) => Promise<{ error?: string }>;

// Used by onboarding (create) and the profile edit page (update).
export function ProfileForm({
  action: serverAction,
  next,
  submitLabel,
  defaults,
}: {
  action: ProfileAction;
  next: string;
  submitLabel: string;
  defaults?: { full_name: string; display_name: string | null; pace_group: PaceGroup | null };
}) {
  const [state, action, pending] = useActionState(serverAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1">
        <span className="font-medium">Full name</span>
        <input name="full_name" autoComplete="name" required defaultValue={defaults?.full_name} className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="font-medium">What should we call you?</span>
        <input
          name="display_name"
          autoComplete="nickname"
          placeholder="Optional"
          defaultValue={defaults?.display_name ?? ""}
          className={inputClass}
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="font-medium">Pace group</legend>
        <div className="grid grid-cols-3 gap-2">
          {PACES.map((p) => (
            <label
              key={p.value}
              className="cursor-pointer rounded-xl border border-navy/15 p-3 text-center has-[:checked]:border-sunrise has-[:checked]:bg-sunrise/10"
            >
              <input
                type="radio"
                name="pace_group"
                value={p.value}
                defaultChecked={p.value === (defaults?.pace_group ?? "steady")}
                className="sr-only"
              />
              <span className="block font-display text-lg font-bold uppercase">{p.label}</span>
              <span className="block text-xs text-navy/60">{p.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && <Message tone="error">{state.error}</Message>}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
