import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { circleBookId, rating } = await request.json();

  if (!circleBookId || typeof rating !== "number" || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Invalid rating (1–10 required)." }, { status: 400 });
  }

  const db = supabaseService();

  // Verify user is a member of the circle this book belongs to
  const { data: cb } = await db
    .from("circle_books")
    .select("circle_id")
    .eq("id", circleBookId)
    .single();

  if (!cb) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const { data: membership } = await db
    .from("circle_members")
    .select("circle_id")
    .eq("circle_id", cb.circle_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const { data, error } = await db
    .from("ratings")
    .upsert(
      { circle_book_id: circleBookId, user_id: user.id, rating, updated_at: new Date().toISOString() },
      { onConflict: "circle_book_id,user_id" }
    )
    .select("id, rating")
    .single();

  if (error) return NextResponse.json({ error: "Failed to save rating." }, { status: 500 });

  return NextResponse.json({ rating: data });
}
