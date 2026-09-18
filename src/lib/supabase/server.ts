import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key.
// Has full DB access — only ever called from API routes or Server Components.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
