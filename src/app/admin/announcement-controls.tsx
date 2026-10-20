"use client";

import { useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteAnnouncement, setAnnouncementPinned } from "./actions";

const small = "rounded-lg border border-navy/15 px-3 py-1.5 text-sm font-medium disabled:opacity-50";
const armed = "rounded-lg bg-sunrise-ink px-3 py-1.5 text-sm font-medium text-white";

export function AnnouncementControls({ id, pinned }: { id: string; pinned: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setAnnouncementPinned(id, !pinned))}
        className={small}
      >
        {pinned ? "Unpin" : "Pin"}
      </button>
      <ConfirmButton
        onConfirm={() => startTransition(() => deleteAnnouncement(id))}
        warning="Delete it for everyone?"
        confirmLabel="Tap to delete"
        disabled={pending}
        className={small}
        armedClassName={armed}
      >
        Delete
      </ConfirmButton>
    </div>
  );
}
