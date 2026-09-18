import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = supabaseServer();

  const { data: group } = await db
    .from("groups")
    .select("id, slug, name, rating_mode, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  return NextResponse.json({ group });
}
