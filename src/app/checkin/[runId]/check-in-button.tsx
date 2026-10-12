"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, Message } from "@/components/ui";
import { formatTime } from "@/lib/format";
import { checkIn, type CheckInState } from "./actions";

export function CheckInButton({ runId, code, name }: { runId: string; code: string; name: string }) {
  const [state, action, pending] = useActionState<CheckInState>(checkIn.bind(null, runId, code), {
    status: "idle",
  });

  if (state.status === "done") {
    return <CheckedIn runId={runId} checkedInAt={state.checkedInAt} badges={state.badges} />;
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-lg">
        Morning, <strong>{name}</strong>. Tap to mark yourself here.
      </p>
      {state.status === "error" && <Message tone="error">{state.message}</Message>}
      <button className={`${buttonClass} py-6 text-2xl`} disabled={pending}>
        {pending ? "Checking in…" : "I'm here"}
      </button>
    </form>
  );
}

export function CheckedIn({
  runId,
  checkedInAt,
  badges = [],
}: {
  runId: string;
  checkedInAt: string;
  badges?: string[];
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-teal text-4xl text-white">
        ✓
      </div>
      <div>
        <p className="font-display text-3xl font-bold uppercase">You&apos;re checked in</p>
        <p className="text-navy/70">at {formatTime(checkedInAt)}. Have a great run!</p>
      </div>
      {badges.length > 0 && (
        <Message tone="info">
          New badge{badges.length > 1 ? "s" : ""}: <strong>{badges.join(", ")}</strong>
        </Message>
      )}
      <p className="text-sm text-navy/60">When you finish, log your distance.</p>
      <Link href={`/runs/${runId}/log`} className={buttonClass}>
        Log my km
      </Link>
      <Link href="/" className="block text-sm text-sunrise-ink underline">
        Back to home
      </Link>
    </div>
  );
}
