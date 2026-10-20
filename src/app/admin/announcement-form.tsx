"use client";

import { useActionState } from "react";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { postAnnouncement } from "./actions";

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(postAnnouncement, {} as { error?: string; posted?: boolean });

  return (
    <form action={action} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Headline</span>
        <input name="title" required maxLength={80} placeholder="e.g. No run this Saturday" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Message</span>
        <textarea
          name="body"
          required
          maxLength={1000}
          rows={3}
          placeholder="e.g. Heavy rain forecast. Rest up, see you next week!"
          className={inputClass}
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input name="pinned" type="checkbox" className="mt-0.5 size-5 accent-sunrise" />
        <span>
          <span className="font-medium">Pin it</span>
          <span className="block text-navy/60">Stays on the home page until you unpin it. Otherwise it shows for a week.</span>
        </span>
      </label>
      {state.error && <Message tone="error">{state.error}</Message>}
      {state.posted && <Message tone="info">Posted. It&apos;s on everyone&apos;s home page now.</Message>}
      <button className={buttonClass} disabled={pending}>
        {pending ? "Posting…" : "Post announcement"}
      </button>
    </form>
  );
}
