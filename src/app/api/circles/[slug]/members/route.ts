import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Params = { params: Promise<{ slug: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { slug } = await params;

  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabaseService();

  const { data: circle } = await db
    .from("circles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!circle) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Verify membership before removing
  const { data: membership } = await db
    .from("circle_members")
    .select("circle_id")
    .eq("circle_id", circle.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  // Remove member
  await db
    .from("circle_members")
    .delete()
    .eq("circle_id", circle.id)
    .eq("user_id", user.id);

  // Check if anyone is left
  const { count } = await db
    .from("circle_members")
    .select("circle_id", { count: "exact", head: true })
    .eq("circle_id", circle.id);

  if (count === 0) {
    // Delete all circle data in dependency order
    const circleBookIds = await db
      .from("circle_books")
      .select("id")
      .eq("circle_id", circle.id)
      .then(({ data }) => (data ?? []).map((cb) => cb.id));

    if (circleBookIds.length > 0) {
      await db.from("ratings").delete().in("circle_book_id", circleBookIds);
    }
    await db.from("circle_books").delete().eq("circle_id", circle.id);
    await db.from("invite_links").delete().eq("circle_id", circle.id);
    await db.from("circles").delete().eq("id", circle.id);

    return NextResponse.json({ left: true, deleted: true });
  }

  return NextResponse.json({ left: true, deleted: false });
}
