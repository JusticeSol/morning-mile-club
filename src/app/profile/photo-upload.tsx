"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar, Message } from "@/components/ui";
import { squareJpeg } from "@/lib/resize-image";
import { removePhoto, uploadPhoto } from "./actions";

export function PhotoUpload({ name, src }: { name: string; src: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      let jpeg: Blob;
      try {
        jpeg = await squareJpeg(file);
      } catch {
        setError("Couldn't read that photo. Try a JPEG or PNG.");
        return;
      }
      setPreview(URL.createObjectURL(jpeg));
      const form = new FormData();
      form.append("photo", new File([jpeg], "photo.jpg", { type: "image/jpeg" }));
      const result = await uploadPhoto(form);
      if (result.error) {
        setError(result.error);
        setPreview(null);
      }
    });
    if (input.current) input.current.value = "";
  };

  const remove = () =>
    startTransition(async () => {
      setError(null);
      const result = await removePhoto();
      if (result.error) setError(result.error);
      else setPreview(null);
    });

  const shown = preview ?? src;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={shown} size="lg" me />
        <div className="space-y-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => input.current?.click()}
            className="block font-medium text-sunrise-ink underline disabled:opacity-50"
          >
            {pending ? "Saving…" : shown ? "Change photo" : "Add a photo"}
          </button>
          {shown && !pending && (
            <button type="button" onClick={remove} className="block text-sm text-navy/60 underline">
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && <Message tone="error">{error}</Message>}
    </div>
  );
}
