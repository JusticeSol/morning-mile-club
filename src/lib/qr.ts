import { isUuid } from "@/lib/uuid";

// Turns the text inside a scanned QR into an in-app check-in path, or null
// if it isn't one of our codes. Only the path and code are kept, so a QR made
// on localhost or a preview deploy still opens the check-in on this site, and
// a code pointing anywhere else is ignored rather than followed.
export function checkinPathFromQr(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim(), "https://placeholder.invalid");
  } catch {
    return null;
  }
  const match = url.pathname.match(/^\/checkin\/([^/]+)\/?$/);
  const code = url.searchParams.get("code");
  if (!match || !isUuid(match[1]) || !code) return null;
  return `/checkin/${match[1]}?code=${encodeURIComponent(code)}`;
}
