import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { BookDetailClient } from "./BookDetailClient";
import type { Book } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; bookId: string }>;
}): Promise<Metadata> {
  const { locale, slug, bookId } = await params;
  const db = supabaseService();
  const { data: cb } = await db
    .from("circle_books")
    .select("books(title, authors, cover_url), circles!inner(name, slug)")
    .eq("id", bookId)
    .single();

  if (!cb) return {};

  type RawBook = { title: string; authors: string[]; cover_url: string | null };
  type RawCircle = { name: string; slug: string };
  const book = cb.books as unknown as RawBook;
  const circle = cb.circles as unknown as RawCircle;

  if (circle.slug !== slug) return {};

  const sv = locale === "sv";
  const authors = book.authors?.join(", ") ?? "";
  const desc = sv
    ? `${book.title}${authors ? ` av ${authors}` : ""} — betygsatt av cirkeln ${circle.name} på Sofiacirkel.`
    : `${book.title}${authors ? ` by ${authors}` : ""} — rated by the circle ${circle.name} on Sofiacirkel.`;

  return {
    title: book.title,
    description: desc,
    openGraph: {
      title: `${book.title} · Sofiacirkel`,
      description: desc,
      url: `https://sofiacirkel.com/${locale}/${slug}/books/${bookId}`,
      images: book.cover_url ? [{ url: book.cover_url, width: 128, height: 192 }] : [],
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; bookId: string }>;
}) {
  const { locale, slug, bookId } = await params;
  const db = supabaseService();
  const user = await getUser();

  // Fetch circle_book with book + ratings
  const { data: cb } = await db
    .from("circle_books")
    .select(`
      id, status, added_by, added_at, circle_id,
      books(id, title, authors, cover_url, description, published_year, page_count),
      ratings(rating, user_id),
      circles!inner(slug, name)
    `)
    .eq("id", bookId)
    .single();

  if (!cb) notFound();

  // Make sure the circle slug matches the URL
  const circleRow = cb.circles as unknown as { slug: string; name: string };
  if (circleRow.slug !== slug) notFound();

  const book = cb.books as unknown as Book;

  type RawRating = { rating: number; user_id: string };
  const ratings = (cb.ratings as unknown as RawRating[]) ?? [];
  const circleRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
      : null;
  const userRating = user ? (ratings.find((r) => r.user_id === user.id)?.rating ?? null) : null;

  const isMember = user
    ? await db
        .from("circle_members")
        .select("circle_id")
        .eq("circle_id", cb.circle_id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => !!data)
    : false;

  return (
    <BookDetailClient
      locale={locale}
      slug={slug}
      circleName={circleRow.name}
      circleBookId={bookId}
      book={book}
      status={cb.status as "read" | "want_to_read"}
      circleRating={circleRating}
      ratingCount={ratings.length}
      userRating={userRating}
      isMember={isMember}
      user={user}
    />
  );
}
