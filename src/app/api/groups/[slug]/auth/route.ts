import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase/server";
import { signGroupToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { groupPassword } = await req.json();

  if (!groupPassword) {
    return NextResponse.json({ error: "Group password is required." }, { status: 400 });
  }

  const db = supabaseServer();
  const { data: group } = await db
    .from("groups")
    .select("password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const valid = await bcrypt.compare(groupPassword, group.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect group password." }, { status: 401 });
  }

  const token = await signGroupToken(slug);
  return NextResponse.json({ token });
}
