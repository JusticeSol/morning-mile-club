"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui";

// Editable message with one-tap Copy and Share to WhatsApp. Admins can tweak
// the text before sending (add a joke, a shout-out, a route change).
export function WhatsAppMessage({ title, hint, text: initial }: { title: string; hint: string; text: string }) {
  const [text, setText] = useState(initial);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / no HTTPS): the text is selectable.
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">{title}</h3>
        <p className="text-sm text-navy/60">{hint}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(14, text.split("\n").length + 1)}
        aria-label={title}
        className={`${inputClass} text-sm leading-relaxed`}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-navy/15 px-4 py-3 font-medium transition active:scale-[0.98]"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#25D366] px-4 py-3 text-center font-medium text-white transition active:scale-[0.98]"
        >
          Share to WhatsApp
        </a>
      </div>
    </div>
  );
}
