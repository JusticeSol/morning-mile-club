import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Per-request Supabase client for Server Components, Server Actions and
// Route Handlers. Reads cookies, so callers must sit behind <Suspense>.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies. proxy.ts refreshes the
            // session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
