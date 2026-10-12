import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
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

  const { data: membership } = await db
    .from("circle_members")
    .select("circle_id")
    .eq("circle_id", circle.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const expiresAt = body.expiresAt ?? null;
  const maxUses = body.maxUses ?? null;

  const { data: invite, error } = await db
    .from("invite_links")
    .insert({
      circle_id: circle.id,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: maxUses,
    })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/join/${invite.token}`;

  return NextResponse.json({ url, token: invite.token }, { status: 201 });
}
