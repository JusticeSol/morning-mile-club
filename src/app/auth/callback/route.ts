import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

// Landing point for the magic link in the login email. Handles both
// link styles Supabase can send:
//   ?code=...                    (default template, PKCE; same browser only)
//   ?token_hash=...&type=email   (custom template; works in any browser)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing code") };

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link&next=${encodeURIComponent(next)}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
