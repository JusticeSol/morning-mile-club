"use client";

import { useEffect } from "react";

// Stops the organiser's phone from dimming or locking while the QR is shown.
// Browsers drop the lock when the tab is hidden, so re-request on return.
export function KeepAwake() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed (e.g. low battery mode); the page still works.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };

    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release();
    };
  }, []);

  return null;
}
