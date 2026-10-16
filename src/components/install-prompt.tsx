"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// "Add to home screen" card. Android/Chrome gets a real Install button (the
// browser's beforeinstallprompt event); iPhones have no such event, so they
// get the Share → Add to Home Screen steps. Hidden once installed (the app
// then runs "standalone") or after the member dismisses it.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Mode = "native" | "ios" | "android" | null;

const DISMISSED = "mmc-install-dismissed";

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>(null);
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {}
    if (standalone || dismissed) return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    // Mode is read from the browser, which only exists after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(ios ? "ios" : /Android/.test(ua) ? "android" : null);

    const onPrompt = (e: Event) => {
      e.preventDefault(); // show our own button instead of the browser's mini-bar
      setEvent(e as InstallEvent);
      setMode("native");
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
    setMode(null);
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") setMode(null);
    setEvent(null);
  };

  return (
    <section className="rounded-2xl bg-navy p-4 text-white">
      <div className="flex items-start gap-3">
        <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold uppercase leading-tight">Put the club on your home screen</p>
          {mode === "native" && (
            <p className="text-sm text-white/70">Opens like an app, straight to check-in and your km.</p>
          )}
          {mode === "ios" && (
            <p className="text-sm text-white/70">
              In <strong>Safari</strong>, tap the <strong>Share</strong> button (the square with an arrow), then{" "}
              <strong>Add to Home Screen</strong>.
            </p>
          )}
          {mode === "android" && (
            <p className="text-sm text-white/70">
              Open your browser menu (<strong>⋮</strong>), then tap <strong>Add to Home screen</strong> or{" "}
              <strong>Install app</strong>.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {mode === "native" && (
          <button
            type="button"
            onClick={install}
            className="flex-1 rounded-xl bg-sunrise px-4 py-2.5 font-display text-lg font-bold uppercase"
          >
            Install app
          </button>
        )}
        <button type="button" onClick={dismiss} className="rounded-xl px-4 py-2.5 text-sm text-white/70 underline">
          {mode === "native" ? "Not now" : "Got it"}
        </button>
      </div>
    </section>
  );
}
