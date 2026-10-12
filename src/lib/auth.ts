import { supabaseServer } from "./supabase/server";

export async function getUser() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
