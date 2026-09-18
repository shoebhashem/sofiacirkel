import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyAuthHeader } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const authorized = await verifyAuthHeader(req.headers.get("authorization"), slug);
  if (!authorized) {
    return NextResponse.json({ error: "Group password required." }, { status: 401 });
  }

  const { ratingMode } = await req.json();
  if (!["public", "private"].includes(ratingMode)) {
    return NextResponse.json({ error: "Invalid rating mode." }, { status: 400 });
  }

  const db = supabaseServer();
  const { data, error } = await db
    .from("groups")
    .update({ rating_mode: ratingMode })
    .eq("slug", slug)
    .select("id, slug, name, rating_mode, created_at")
    .single();

  if (error) return NextResponse.json({ error: "Update failed." }, { status: 500 });
  return NextResponse.json({ group: data });
}
