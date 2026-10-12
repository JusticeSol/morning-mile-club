"use client";

import { useActionState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { createRun } from "./actions";

export function NewRunForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState(createRun, {} as { error?: string });

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date</span>
          <input name="run_date" type="date" required defaultValue={defaultDate} className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Distance (km)</span>
          <input
            name="default_km"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            max="60"
            defaultValue="12"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Title</span>
        <input name="title" placeholder="e.g. Saturday #34" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes</span>
        <textarea name="notes" rows={2} placeholder="Optional: route changes, water stops…" className={inputClass} />
      </label>
      {state.error && <Message tone="error">{state.error}</Message>}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Creating…" : "Create run"}
      </button>
    </form>
  );
}
