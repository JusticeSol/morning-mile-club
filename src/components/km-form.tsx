"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";

// The km stepper + optional time, shared by a member logging their own run
// and an admin entering km for someone else. The caller passes the server
// actions (already bound to the run / member) and the wording.
export type KmFormState = { status: "idle" } | { status: "error"; message: string };

const STEP = 0.5;
const MIN = 0.1;
const MAX = 60;

// Accepts "12", "12.3" or "12,3" (comma decimal keyboards); one decimal place.
function parseKm(text: string) {
  const n = Number(text.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : NaN;
}
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n * 10) / 10));

export function KmForm({
  save,
  remove,
  initialKm,
  initialSeconds,
  hasLog,
  labels,
  backHref,
  backLabel,
}: {
  save: (prev: KmFormState, formData: FormData) => Promise<KmFormState>;
  remove: () => Promise<void>;
  initialKm: number;
  initialSeconds: number | null;
  hasLog: boolean;
  labels: { create: string; update: string; remove: string };
  backHref: string;
  backLabel: string;
}) {
  const [state, action, pending] = useActionState<KmFormState, FormData>(save, { status: "idle" });
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
          {pending ? "Saving…" : hasLog ? labels.update : labels.create}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href={backHref} className="text-sunrise-ink underline">
          {backLabel}
        </Link>
        {hasLog && (
          <form action={remove}>
            <button className="text-navy/50 underline">{labels.remove}</button>
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
