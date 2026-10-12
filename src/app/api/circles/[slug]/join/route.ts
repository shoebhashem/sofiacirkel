import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;

  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Token required." }, { status: 400 });

  const db = supabaseService();

  // Validate invite
  const { data: invite } = await db
    .from("invite_links")
    .select("id, circle_id, expires_at, max_uses, use_count")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite link has expired." }, { status: 410 });
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: "Invite link has reached its limit." }, { status: 410 });
  }

  // Verify this is for the right circle
  const { data: circle } = await db
    .from("circles")
    .select("id, slug")
    .eq("id", invite.circle_id)
    .eq("slug", slug)
    .single();

  if (!circle) return NextResponse.json({ error: "Circle not found." }, { status: 404 });

  // Add member (ignore if already exists)
  await db
    .from("circle_members")
    .upsert({ circle_id: circle.id, user_id: user.id }, { onConflict: "circle_id,user_id" });

  // Increment use count
  await db
    .from("invite_links")
    .update({ use_count: invite.use_count + 1 })
    .eq("id", invite.id);

  return NextResponse.json({ slug: circle.slug });
}
