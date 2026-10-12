import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name: string = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const slug = body.slug?.trim() || toSlug(name);
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid URL name." }, { status: 400 });
  }

  const db = supabaseService();

  // Find a unique slug — try base slug, then base-2, base-3, …
  const baseSlug = slug.slice(0, 37); // leave room for "-99"
  const { data: existing } = await db
    .from("circles")
    .select("slug")
    .or(
      [baseSlug, ...Array.from({ length: 9 }, (_, i) => `${baseSlug}-${i + 2}`)]
        .map((s) => `slug.eq.${s}`)
        .join(",")
    );

  const takenSlugs = new Set((existing ?? []).map((r) => r.slug));
  let finalSlug = baseSlug;
  if (takenSlugs.has(finalSlug)) {
    for (let i = 2; i <= 10; i++) {
      const candidate = `${baseSlug}-${i}`;
      if (!takenSlugs.has(candidate)) { finalSlug = candidate; break; }
    }
  }

  // Create circle
  const { data: circle, error } = await db
    .from("circles")
    .insert({ name, slug: finalSlug, created_by: user.id })
    .select("id, slug, name")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create circle." }, { status: 500 });
  }

  // Add creator as member
  await db.from("circle_members").insert({ circle_id: circle.id, user_id: user.id });

  return NextResponse.json({ circle }, { status: 201 });
}
