import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase/server";
import { signGroupToken } from "@/lib/auth";

const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, groupPassword, ratingMode } = body as {
    name: string;
    slug: string;
    groupPassword: string;
    ratingMode: "public" | "private";
  };

  if (!name?.trim() || !slug || !groupPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Group name must be 3–40 characters: lowercase letters, numbers, and hyphens only." },
      { status: 400 }
    );
  }
  if (groupPassword.length < 4) {
    return NextResponse.json(
      { error: "Group password must be at least 4 characters." },
      { status: 400 }
    );
  }

  const db = supabaseServer();
  const { data: existing } = await db
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "That group name is already taken." }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(groupPassword, 10);

  const { data: group, error } = await db
    .from("groups")
    .insert({ slug, name: name.trim(), password_hash, rating_mode: ratingMode ?? "public" })
    .select("id, slug, name, rating_mode, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }

  // Issue a group token so the creator is immediately authenticated
  const token = await signGroupToken(slug);

  return NextResponse.json({ group, token }, { status: 201 });
}
