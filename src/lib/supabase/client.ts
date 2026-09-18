"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side client using the public anon key.
// Used only for read operations or realtime — never for writes.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
