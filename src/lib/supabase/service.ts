import { createClient } from "@supabase/supabase-js";

// Service role client — full DB access, bypasses RLS.
// Only ever used in API Route Handlers, never in client code.
export function supabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
