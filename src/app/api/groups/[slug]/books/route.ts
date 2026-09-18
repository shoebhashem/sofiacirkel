import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { verifyAuthHeader } from "@/lib/auth";
import type { BookStatus } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = supabaseServer();

  const { data: group } = await db
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  const { data: groupBooks } = await db
    .from("group_books")
    .select(`
      id, status, added_at, finished_at,
      book:books ( id, google_books_id, title, author, cover_url, description, genre, published_year, page_count ),
      ratings ( stars )
    `)
    .eq("group_id", group.id)
    .order("added_at", { ascending: false });

  // Compute average rating per group-book
  const enriched = (groupBooks ?? []).map((gb) => {
    const stars: number[] = ((gb.ratings as { stars: number }[]) ?? []).map((r) => r.stars);
    return {
      ...gb,
      ratings: undefined,
      average_rating: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : null,
      rating_count: stars.length,
    };
  });

  return NextResponse.json({ books: enriched });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const authorized = await verifyAuthHeader(req.headers.get("authorization"), slug);
  if (!authorized) {
    return NextResponse.json({ error: "Group password required." }, { status: 401 });
  }

  const body = await req.json();
  const { googleBook, status = "want_to_read" } = body as {
    googleBook: {
      google_books_id: string;
      title: string;
      author?: string;
      cover_url?: string;
      description?: string;
      genre?: string;
      published_year?: number;
      page_count?: number;
    };
    status?: BookStatus;
  };

  const db = supabaseServer();

  const { data: group } = await db
    .from("groups")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  // Upsert book into shared catalog
  const { data: book, error: bookError } = await db
    .from("books")
    .upsert(
      {
        google_books_id: googleBook.google_books_id,
        title: googleBook.title,
        author: googleBook.author ?? null,
        cover_url: googleBook.cover_url ?? null,
        description: googleBook.description ?? null,
        genre: googleBook.genre ?? null,
        published_year: googleBook.published_year ?? null,
        page_count: googleBook.page_count ?? null,
      },
      { onConflict: "google_books_id" }
    )
    .select()
    .single();

  if (bookError) {
    return NextResponse.json({ error: "Failed to save book." }, { status: 500 });
  }

  // Link book to this group
  const { data: groupBook, error: gbError } = await db
    .from("group_books")
    .insert({ group_id: group.id, book_id: book.id, status })
    .select()
    .single();

  if (gbError) {
    if (gbError.code === "23505") {
      return NextResponse.json({ error: "This book is already in your list." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add book." }, { status: 500 });
  }

  return NextResponse.json({ groupBook: { ...groupBook, book } }, { status: 201 });
}
