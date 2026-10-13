"use server";

import type { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

export type LoginState =
  | { step: "enter"; error?: string }
  | { step: "verify"; method: "email" | "phone"; contact: string; error?: string };

// Accepts Nigerian local numbers (0803 123 4567) as well as +234... and
// returns E.164, which Supabase phone auth requires.
function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
}

// Supabase's auth errors are written for developers ("email rate limit
// exceeded"); members see these instead.
function friendlySendError(error: AuthError, method: "email" | "phone") {
  const wait = error.message.match(/after (\d+) seconds?/);
  if (wait) return `Please wait ${wait[1]} seconds before asking for another code.`;

  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Too many login emails have gone out in the last hour. Please try again a bit later.";
    case "over_sms_send_rate_limit":
      return "Too many login texts have gone out recently. Please try again a bit later, or use email.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "email_address_invalid":
      return "That email address doesn't look right.";
    case "phone_provider_disabled":
    case "sms_send_failed":
      return "Phone login isn't available right now. Please log in with your email.";
    case "signup_disabled":
      return "New sign-ups are closed. Ask an organiser in the WhatsApp group.";
  }
  console.error("sendCode", error.code, error.message);
  return `We couldn't send your code. Check your ${method === "phone" ? "number" : "email"} and try again.`;
}

function friendlyVerifyError(error: AuthError) {
  if (error.code === "otp_expired") return "That code has expired or was already used. Send a new one.";
  if (error.code === "over_request_rate_limit") return "Too many attempts. Wait a minute and try again.";
  return "That code didn't work. Check it, or send a new one.";
}

export async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const method = formData.get("method") === "phone" ? "phone" : "email";
  const raw = String(formData.get("contact") ?? "").trim();
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!raw) {
    return { step: "enter", error: `Enter your ${method === "phone" ? "phone number" : "email"}.` };
  }

  const supabase = await createClient();

  if (method === "phone") {
    const phone = normalizePhone(raw);
    if (!/^\+\d{10,15}$/.test(phone)) {
      return { step: "enter", error: "That phone number doesn't look right." };
    }
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { step: "enter", error: friendlySendError(error, method) };
    return { step: "verify", method, contact: phone };
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email: raw,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { step: "enter", error: friendlySendError(error, method) };
  return { step: "verify", method, contact: raw };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const method = formData.get("method") === "phone" ? "phone" : "email";
  const contact = String(formData.get("contact") ?? "");
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const next = safeNext(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { error } =
    method === "phone"
      ? await supabase.auth.verifyOtp({ phone: contact, token, type: "sms" })
      : await supabase.auth.verifyOtp({ email: contact, token, type: "email" });

  if (error) {
    return { step: "verify", method, contact, error: friendlyVerifyError(error) };
  }

  redirect(next);
}
