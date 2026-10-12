import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { getBook } from "@/lib/google-books";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const db = supabaseService();

  const { data: circle } = await db
    .from("circles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!circle) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: books } = await db
    .from("circle_books")
    .select(`
      id, status, added_at,
      books(id, title, authors, cover_url, published_year),
      ratings(rating, user_id)
    `)
    .eq("circle_id", circle.id)
    .order("added_at", { ascending: false });

  return NextResponse.json({ books: books ?? [] });
}

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;

  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = supabaseService();

  // Verify membership
  const { data: circle } = await db
    .from("circles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!circle) return NextResponse.json({ error: "Circle not found." }, { status: 404 });

  const { data: membership } = await db
    .from("circle_members")
    .select("circle_id")
    .eq("circle_id", circle.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const body = await request.json();
  const googleBook = body.book;
  const status: "read" | "want_to_read" = body.status ?? "want_to_read";

  if (!googleBook?.id) {
    return NextResponse.json({ error: "Book ID required." }, { status: 400 });
  }

  // Upsert book into global catalog
  const existing = await db.from("books").select("id").eq("id", googleBook.id).maybeSingle();
  if (!existing.data) {
    const fetched = await getBook(googleBook.id);
    if (!fetched) return NextResponse.json({ error: "Book not found." }, { status: 404 });

    await db.from("books").upsert({
      id: fetched.id,
      title: fetched.title,
      authors: fetched.authors,
      cover_url: fetched.cover_url,
      description: fetched.description,
      published_year: fetched.published_year,
      page_count: fetched.page_count,
    });
  }

  // Add to circle
  const { data: circleBook, error } = await db
    .from("circle_books")
    .insert({ circle_id: circle.id, book_id: googleBook.id, added_by: user.id, status })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Book already in this circle." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add book." }, { status: 500 });
  }

  return NextResponse.json({ circleBook }, { status: 201 });
}
