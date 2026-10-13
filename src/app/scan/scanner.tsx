"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/components/ui";
import { checkinPathFromQr } from "@/lib/qr";

// Minimal typing for the Barcode Detection API (Chrome on Android); not in
// TypeScript's DOM lib yet.
type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}

type Status = "starting" | "scanning" | "found" | "denied" | "unavailable";

const SCAN_EVERY_MS = 250;
const MAX_FRAME = 640; // downscale frames for the jsQR fallback; plenty for a QR

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [wrongCode, setWrongCode] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (e) {
        setStatus(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "unavailable");
        return;
      }
      if (stopped) return stop();

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStatus("scanning");

      // Prefer the phone's built-in QR detector; iPhones don't have one, so
      // fall back to jsQR (loaded only when needed).
      const native = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const jsQR = native ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const readFrame = async (): Promise<string | null> => {
        if (video.readyState < 2 || !video.videoWidth) return null;
        if (native) {
          const codes = await native.detect(video);
          return codes[0]?.rawValue ?? null;
        }
        const scale = Math.min(1, MAX_FRAME / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data, width, height } = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR!(data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
      };

      const tick = async () => {
        if (stopped) return;
        const text = await readFrame().catch(() => null);
        if (text) {
          const path = checkinPathFromQr(text);
          if (path) {
            setStatus("found");
            navigator.vibrate?.(80);
            stop();
            router.push(path);
            return;
          }
          setWrongCode(true);
        }
        timer = setTimeout(tick, SCAN_EVERY_MS);
      };
      tick();
    })();

    return stop;
  }, [router]);

  if (status === "denied") {
    return (
      <Message tone="error">
        Camera access is blocked. Allow the camera for this site in your browser settings, then reload. Or just
        point your phone&apos;s normal camera app at the QR code.
      </Message>
    );
  }
  if (status === "unavailable") {
    return (
      <Message tone="error">
        We couldn&apos;t open your camera here. Point your phone&apos;s normal camera app at the QR code instead.
        It opens the same check-in page.
      </Message>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-navy">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        {/* Viewfinder frame */}
        <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-4 border-sunrise shadow-[0_0_0_9999px_rgba(16,24,32,0.45)]" />
        {status === "starting" && (
          <p className="absolute inset-0 flex items-center justify-center text-white">Opening camera…</p>
        )}
      </div>
      <p className="text-center text-navy/70" aria-live="polite">
        {status === "found" ? "Got it! Opening check-in…" : "Point your camera at the QR code on the organiser’s phone."}
      </p>
      {wrongCode && status === "scanning" && (
        <Message tone="error">That isn&apos;t a Morning Mile Club check-in code. Scan the one at the meetup.</Message>
      )}
    </div>
  );
}
