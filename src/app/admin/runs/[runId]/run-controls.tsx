"use client";

import { useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import type { RunStatus } from "@/lib/types";
import { setRunStatus } from "../../actions";

const secondary =
  "w-full rounded-xl border border-navy/15 px-4 py-3 font-medium transition active:scale-[0.98] disabled:opacity-50";
const armed = "w-full rounded-xl bg-sunrise-ink px-4 py-3 font-medium text-white";

export function RunControls({ runId, status, isFuture }: { runId: string; status: RunStatus; isFuture: boolean }) {
  const [pending, startTransition] = useTransition();
  const change = (next: RunStatus) => startTransition(() => setRunStatus(runId, next));

  // Completed runs can be cancelled directly: reopening one after check-in
  // closes would just auto-complete again on the next page load.
  if (status === "completed") {
    return (
      <ConfirmButton
        onConfirm={() => change("cancelled")}
        warning="Cancel this run? It won't count for anyone and won't break streaks."
        disabled={pending}
        className={secondary}
        armedClassName={armed}
      >
        {pending ? "Saving…" : "Cancel run"}
      </ConfirmButton>
    );
  }

  if (status === "cancelled") {
    return (
      <ConfirmButton
        onConfirm={() => change("scheduled")}
        warning="Reopen this run? If people checked in and check-in has closed, it will count as completed."
        disabled={pending}
        className={secondary}
        armedClassName={armed}
      >
        {pending ? "Saving…" : "Reopen run"}
      </ConfirmButton>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 items-start gap-2">
        {isFuture ? (
          <p className="rounded-xl bg-paper px-3 py-2 text-xs text-navy/60">
            Completes automatically at 8:20 on run day.
          </p>
        ) : (
          <ConfirmButton
            onConfirm={() => change("completed")}
            warning="Finish this run now? Streaks and badges update for everyone checked in. (It happens automatically at 8:20 anyway.)"
            disabled={pending}
            className={`${secondary} border-teal text-teal`}
            armedClassName={armed}
          >
            {pending ? "Saving…" : "Mark completed"}
          </ConfirmButton>
        )}
        <ConfirmButton
          onConfirm={() => change("cancelled")}
          warning="Cancel this run (rain, holiday)? It won't break anyone's streak."
          disabled={pending}
          className={secondary}
          armedClassName={armed}
        >
          {pending ? "Saving…" : "Cancel run"}
        </ConfirmButton>
      </div>
    </div>
  );
}
