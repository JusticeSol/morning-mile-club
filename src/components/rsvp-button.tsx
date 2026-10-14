"use client";

import { useOptimistic, useTransition } from "react";
import { setRsvp } from "@/app/actions";

// "I'm in" toggle with the running count of who's coming.
export function RsvpButton({
  runId,
  going,
  count,
  names,
}: {
  runId: string;
  going: boolean;
  count: number;
  names: string[]; // a few first names, for "Ada, Tunde and 12 others"
}) {
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic({ going, count }, (_s, next: { going: boolean; count: number }) => next);

  const toggle = () =>
    startTransition(async () => {
      setState({ going: !state.going, count: state.count + (state.going ? -1 : 1) });
      await setRsvp(runId, !state.going);
    });

  const others = state.count - (state.going ? 1 : 0);
  const shown = names.slice(0, 3);
  const summary =
    state.count === 0
      ? "Be the first to say you're coming!"
      : state.going
        ? others === 0
          ? "You're the first one in. Tell the group!"
          : `You and ${others} other${others === 1 ? "" : "s"} are coming 💪`
        : `${shown.join(", ")}${state.count > shown.length ? ` and ${state.count - shown.length} more` : ""} ${
            state.count === 1 ? "is" : "are"
          } coming 💪`;

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={state.going}
        className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-display text-xl font-bold uppercase tracking-wide transition active:scale-[0.98] ${
          state.going ? "bg-teal text-white" : "border-2 border-navy text-navy"
        }`}
      >
        {state.going ? "✓ I'm in" : "I'm in"}
      </button>
      <p className="text-center text-sm text-navy/60">{summary}</p>
    </div>
  );
}
