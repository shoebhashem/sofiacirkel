import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Params = { params: Promise<{ slug: string; bookId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { slug, bookId } = await params;

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

  const { data: membership } = await db
    .from("circle_members")
    .select("circle_id")
    .eq("circle_id", circle.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const { error } = await db
    .from("circle_books")
    .delete()
    .eq("id", bookId)
    .eq("circle_id", circle.id);

  if (error) return NextResponse.json({ error: "Failed to remove book." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
