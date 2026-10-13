"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { deleteLog, saveLog, type LogState } from "./actions";

const STEP = 0.5;
const MIN = 0.5;
const MAX = 60;

export function LogForm({
  runId,
  initialKm,
  initialSeconds,
  hasLog,
}: {
  runId: string;
  initialKm: number;
  initialSeconds: number | null;
  hasLog: boolean;
}) {
  const [state, action, pending] = useActionState<LogState, FormData>(saveLog.bind(null, runId), {
    status: "idle",
  });
  const [km, setKm] = useState(initialKm);
  const initialMinutes = initialSeconds ? Math.round(initialSeconds / 60) : null;

  const nudge = (delta: number) =>
    setKm((v) => Math.min(MAX, Math.max(MIN, Math.round((v + delta) * 10) / 10)));

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-6">
        <input type="hidden" name="distance_km" value={km} />

        <div className="flex items-center justify-between gap-3">
          <StepButton label={`Minus ${STEP} km`} onClick={() => nudge(-STEP)} disabled={km <= MIN}>
            −
          </StepButton>
          <p className="text-center" aria-live="polite">
            <span className="font-display text-7xl font-bold leading-none">{km.toFixed(1)}</span>
            <span className="block text-sm font-medium uppercase tracking-widest text-navy/60">km</span>
          </p>
          <StepButton label={`Plus ${STEP} km`} onClick={() => nudge(STEP)} disabled={km >= MAX}>
            +
          </StepButton>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-medium">
            Time <span className="font-normal text-navy/50">(optional)</span>
          </legend>
          <div className="flex items-center gap-2">
            <input
              name="hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={9}
              placeholder="h"
              aria-label="Hours"
              defaultValue={initialMinutes ? Math.floor(initialMinutes / 60) : undefined}
              className={`${inputClass} w-20 text-center`}
            />
            <span className="font-bold">:</span>
            <input
              name="minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              placeholder="mm"
              aria-label="Minutes"
              defaultValue={initialMinutes ? initialMinutes % 60 : undefined}
              className={`${inputClass} w-24 text-center`}
            />
          </div>
        </fieldset>

        {state.status === "error" && <Message tone="error">{state.message}</Message>}

        <button className={buttonClass} disabled={pending}>
          {pending ? "Saving…" : hasLog ? "Update my run" : "Log my run"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href="/" className="text-sunrise-ink underline">
          Back to home
        </Link>
        {hasLog && (
          <form action={deleteLog.bind(null, runId)}>
            <button className="text-navy/50 underline">Remove my log</button>
          </form>
        )}
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-16 shrink-0 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white transition active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
