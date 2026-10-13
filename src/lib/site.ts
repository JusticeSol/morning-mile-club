import "server-only";
import { headers } from "next/headers";

// Public URL of the site, for QR codes and WhatsApp messages. Set
// NEXT_PUBLIC_SITE_URL in production; otherwise use the request's host.
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
