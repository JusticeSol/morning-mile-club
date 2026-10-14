"use client";

import { useActionState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { setGoal } from "./actions";

export function GoalForm({
  month,
  name,
  targetKm,
}: {
  month: string; // YYYY-MM
  name?: string;
  targetKm?: number;
}) {
  const [state, action, pending] = useActionState(setGoal, {} as { error?: string; saved?: boolean });

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Month</span>
          <input name="month" type="month" required defaultValue={month} className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Target (km)</span>
          <input
            name="target_km"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            required
            defaultValue={targetKm ?? 130}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Goal name</span>
        <input
          name="name"
          required
          maxLength={60}
          defaultValue={name ?? ""}
          placeholder="e.g. Gbagada → Ibadan"
          className={inputClass}
        />
      </label>
      <p className="text-xs text-navy/60">
        Ideas: Gbagada → Ibadan (130 km), Gbagada → Abeokuta (100 km), Gbagada → Benin (320 km), Gbagada → Abuja (760 km).
      </p>
      {state.error && <Message tone="error">{state.error}</Message>}
      {state.saved && <Message tone="info">Goal saved. It&apos;s on everyone&apos;s home page now.</Message>}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : name ? "Update goal" : "Set goal"}
      </button>
    </form>
  );
}
