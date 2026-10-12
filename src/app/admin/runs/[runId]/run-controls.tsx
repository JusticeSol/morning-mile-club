"use client";

import { useTransition } from "react";
import type { RunStatus } from "@/lib/types";
import { setRunStatus } from "../../actions";

const secondary =
  "w-full rounded-xl border border-navy/15 px-4 py-3 font-medium transition active:scale-[0.98] disabled:opacity-50";

export function RunControls({ runId, status }: { runId: string; status: RunStatus }) {
  const [pending, startTransition] = useTransition();

  const change = (next: RunStatus, question: string) => {
    if (!confirm(question)) return;
    startTransition(() => setRunStatus(runId, next));
  };

  if (status !== "scheduled") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => change("scheduled", "Reopen this run? It will stop counting towards streaks until completed again.")}
        className={secondary}
      >
        Reopen run
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          change("completed", "Mark this run completed? Streaks and badges will update for everyone who checked in.")
        }
        className={`${secondary} border-teal text-teal`}
      >
        Mark completed
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => change("cancelled", "Cancel this run? It won't break anyone's streak.")}
        className={secondary}
      >
        Cancel run
      </button>
    </div>
  );
}
