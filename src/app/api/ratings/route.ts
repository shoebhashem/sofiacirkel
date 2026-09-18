import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyAuthHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { groupBookId, raterId, stars, slug } = body as {
    groupBookId: string;
    raterId: string;
    stars: number;
    slug: string;
  };

  if (!groupBookId || !raterId || !slug) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof stars !== "number" || stars < 1 || stars > 10) {
    return NextResponse.json({ error: "Rating must be between 1 and 10." }, { status: 400 });
  }

  const db = supabaseServer();

  // Check the group's rating mode
  const { data: group } = await db
    .from("groups")
    .select("id, rating_mode")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  if (group.rating_mode === "private") {
    const authorized = await verifyAuthHeader(req.headers.get("authorization"), slug);
    if (!authorized) {
      return NextResponse.json(
        { error: "This group requires the group password to rate books." },
        { status: 401 }
      );
    }
  }

  // Upsert: update rating if same rater rates again
  const { data, error } = await db
    .from("ratings")
    .upsert(
      { group_book_id: groupBookId, rater_id: raterId, stars },
      { onConflict: "group_book_id,rater_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to save rating." }, { status: 500 });
  return NextResponse.json({ rating: data });
}
