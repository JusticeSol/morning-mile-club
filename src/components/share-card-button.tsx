"use client";

import { useState } from "react";

// Shares the member's run card image. On phones this opens the share sheet
// (pick WhatsApp → My status); elsewhere it downloads the image.
export function ShareCardButton({ runId, className = "" }: { runId: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/share/${runId}/card`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], "morning-mile-club.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: "Saturday run with Morning Mile Club 🏃🌅" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (e) {
      // Closing the share sheet isn't an error.
      if (!(e instanceof DOMException && e.name === "AbortError")) setError("Couldn't make your card. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Making your card…" : "Share to WhatsApp status"}
      </button>
      {error && <p className="mt-1 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}
