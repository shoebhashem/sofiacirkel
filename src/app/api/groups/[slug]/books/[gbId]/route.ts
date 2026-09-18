import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyAuthHeader } from "@/lib/auth";

// PATCH: move book status (want_to_read → already_read) or update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; gbId: string }> }
) {
  const { slug, gbId } = await params;

  const authorized = await verifyAuthHeader(req.headers.get("authorization"), slug);
  if (!authorized) {
    return NextResponse.json({ error: "Group password required." }, { status: 401 });
  }

  const { status } = await req.json();
  if (!["want_to_read", "already_read"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const db = supabaseServer();
  const { data, error } = await db
    .from("group_books")
    .update({
      status,
      finished_at: status === "already_read" ? new Date().toISOString() : null,
    })
    .eq("id", gbId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Update failed." }, { status: 500 });
  return NextResponse.json({ groupBook: data });
}

// DELETE: remove a book from the group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; gbId: string }> }
) {
  const { slug, gbId } = await params;

  const authorized = await verifyAuthHeader(req.headers.get("authorization"), slug);
  if (!authorized) {
    return NextResponse.json({ error: "Group password required." }, { status: 401 });
  }

  const db = supabaseServer();
  const { error } = await db.from("group_books").delete().eq("id", gbId);
  if (error) return NextResponse.json({ error: "Delete failed." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
