"use client";

import { useRef, useState, useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { buttonClass, inputClass, Message } from "@/components/ui";
import { fittedJpeg } from "@/lib/resize-image";
import { postRunPhoto, removeRunPhoto } from "../../actions";

const secondary = "w-full rounded-xl border border-navy/15 px-4 py-3 font-medium disabled:opacity-50";
const armed = "w-full rounded-xl bg-sunrise-ink px-4 py-3 font-medium text-white";

// Photo of the week for one run: pick, add a caption, post. Posting again
// replaces it.
export function RunPhotoUpload({
  runId,
  current,
}: {
  runId: string;
  current: { url: string; caption: string | null } | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ blob: Blob; preview: string } | null>(null);
  const [caption, setCaption] = useState(current?.caption ?? "");
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const pick = (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const blob = await fittedJpeg(file);
        setPicked({ blob, preview: URL.createObjectURL(blob) });
      } catch {
        setMessage({ tone: "error", text: "Couldn't read that photo. Try a JPEG or PNG." });
      }
    });
    if (input.current) input.current.value = "";
  };

  const post = () =>
    startTransition(async () => {
      const form = new FormData();
      if (picked) form.append("photo", new File([picked.blob], "photo.jpg", { type: "image/jpeg" }));
      form.append("caption", caption);
      const result = await postRunPhoto(runId, form);
      if (result.error) return setMessage({ tone: "error", text: result.error });
      setPicked(null);
      setMessage({ tone: "info", text: "Posted. It's on everyone's home page now." });
    });

  const remove = () =>
    startTransition(async () => {
      const result = await removeRunPhoto(runId);
      if (result.error) return setMessage({ tone: "error", text: result.error });
      setCaption("");
      setMessage({ tone: "info", text: "Photo removed." });
    });

  const shown = picked?.preview ?? current?.url;
  const changed = !!picked || (current != null && caption.trim() !== (current.caption ?? ""));

  return (
    <div className="space-y-3">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="Group photo" className="w-full rounded-xl" />
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy/15 text-navy/60"
        >
          <span className="text-3xl" aria-hidden>
            📸
          </span>
          <span className="font-medium">{pending ? "Loading…" : "Choose the group photo"}</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      {shown && (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Caption (optional)</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={140}
              placeholder="e.g. 14 of us at the turnaround 🙌"
              className={inputClass}
            />
          </label>
          {changed && (
            <button type="button" onClick={post} disabled={pending} className={buttonClass}>
              {pending ? "Posting…" : current ? "Save changes" : "Post photo"}
            </button>
          )}
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className={secondary}
          >
            {picked ? "Pick a different photo" : "Replace photo"}
          </button>
          {current && !picked && (
            <ConfirmButton
              onConfirm={remove}
              warning="Remove this photo from the home page?"
              disabled={pending}
              className={secondary}
              armedClassName={armed}
            >
              Remove photo
            </ConfirmButton>
          )}
        </>
      )}
      {message && <Message tone={message.tone}>{message.text}</Message>}
    </div>
  );
}
