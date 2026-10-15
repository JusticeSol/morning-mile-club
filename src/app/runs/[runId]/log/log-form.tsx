"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { deleteLog, saveLog, type LogState } from "./actions";

const STEP = 0.5;
const MIN = 0.1;
const MAX = 60;

// Accepts "12", "12.3" or "12,3" (comma decimal keyboards); one decimal place.
function parseKm(text: string) {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : NaN;
}
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n * 10) / 10));

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
  // Kept as text so members can type freely; the buttons nudge by 0.5.
  const [text, setText] = useState(initialKm.toFixed(1));
  const km = parseKm(text);
  const valid = km >= MIN && km <= MAX;
  const initialMinutes = initialSeconds ? Math.round(initialSeconds / 60) : null;

  const nudge = (delta: number) => setText(clamp((Number.isNaN(km) ? initialKm : km) + delta).toFixed(1));

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <StepButton label={`Minus ${STEP} km`} onClick={() => nudge(-STEP)} disabled={valid && km <= MIN}>
            −
          </StepButton>
          <label className="min-w-0 flex-1 text-center">
            <input
              name="distance_km"
              value={text}
              onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
              onBlur={() => valid && setText(km.toFixed(1))}
              onFocus={(e) => e.target.select()}
              inputMode="decimal"
              autoComplete="off"
              aria-label="Distance in km"
              aria-invalid={!valid}
              className="w-full rounded-xl border-2 border-dashed border-navy/20 bg-transparent py-1 text-center font-hand text-7xl leading-none outline-none focus:border-teal"
            />
            <span className="block text-sm font-medium uppercase tracking-widest text-navy/60">km</span>
          </label>
          <StepButton label={`Plus ${STEP} km`} onClick={() => nudge(STEP)} disabled={valid && km >= MAX}>
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

        {!valid && text !== "" && <Message tone="error">Enter a distance between 0.1 and 60 km.</Message>}
        {state.status === "error" && <Message tone="error">{state.message}</Message>}

        <button className={buttonClass} disabled={pending || !valid}>
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
