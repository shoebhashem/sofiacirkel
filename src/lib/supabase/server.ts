import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-based client for Server Components and Route Handlers.
// Reads and refreshes the user session from cookies.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — session refresh handled by proxy
          }
        },
      },
    }
  );
}
