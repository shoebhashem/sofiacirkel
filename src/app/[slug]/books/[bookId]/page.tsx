"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/RatingStars";
import { PasswordGate } from "@/components/PasswordGate";
import type { GroupBook } from "@/types";

function getRaterId(): string {
  let id = localStorage.getItem("bookclub_rater_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bookclub_rater_id", id);
  }
  return id;
}

export default function BookDetailPage() {
  const { slug, bookId } = useParams<{ slug: string; bookId: string }>();

  const [groupBook, setGroupBook] = useState<GroupBook | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ratingMode, setRatingMode] = useState<"public" | "private">("public");
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`bookclub_${slug}_token`);
    if (stored) setToken(stored);

    async function load() {
      const [groupRes, booksRes] = await Promise.all([
        fetch(`/api/groups/${slug}`),
        fetch(`/api/groups/${slug}/books`),
      ]);

      if (!groupRes.ok) { setNotFound(true); setLoading(false); return; }

      const { group } = await groupRes.json();
      setRatingMode(group.rating_mode);

      const { books } = await booksRes.json();
      const gb = books.find((b: GroupBook) => b.id === bookId);
      if (!gb) { setNotFound(true); setLoading(false); return; }

      setGroupBook(gb);
      setLoading(false);
    }
    load();
  }, [slug, bookId]);

  async function submitRating(stars: number) {
    const raterId = getRaterId();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    setRatingError(null);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers,
      body: JSON.stringify({ groupBookId: bookId, raterId, stars, slug }),
    });
    const data = await res.json();

    if (res.status === 401) {
      setShowPasswordGate(true);
      return;
    }
    if (!res.ok) { setRatingError(data.error ?? "Failed to save rating."); return; }

    setUserRating(stars);
    setRatingSaved(true);
    // Refresh average
    const booksRes = await fetch(`/api/groups/${slug}/books`);
    const { books } = await booksRes.json();
    const updated = books.find((b: GroupBook) => b.id === bookId);
    if (updated) setGroupBook(updated);
  }

  if (loading) {
    return <main className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground animate-pulse">Loading…</p></main>;
  }

  if (notFound || !groupBook) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Book not found</h1>
        <Link href={`/${slug}`}><Button variant="secondary">Back to group</Button></Link>
      </main>
    );
  }

  const { book, status, average_rating, rating_count } = groupBook;
  const canRate = status === "already_read";

  return (
    <main className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:underline">← Back to group</Link>

      {/* Book header */}
      <div className="flex gap-4">
        <div className="relative w-24 shrink-0 aspect-[2/3] rounded overflow-hidden bg-muted">
          {book.cover_url ? (
            <Image src={book.cover_url} alt={`Cover of ${book.title}`} fill sizes="96px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">No cover</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="font-serif text-xl font-bold leading-snug">{book.title}</h1>
          {book.author && <p className="text-sm text-muted-foreground">{book.author}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {book.published_year && <Badge variant="outline" className="text-xs">{book.published_year}</Badge>}
            {book.page_count && <Badge variant="outline" className="text-xs">{book.page_count} pages</Badge>}
            {book.genre && <Badge variant="outline" className="text-xs">{book.genre}</Badge>}
          </div>
          <Badge variant={status === "already_read" ? "secondary" : "outline"} className="w-fit mt-1 text-xs">
            {status === "already_read" ? "Read" : "Want to read"}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
      )}

      {/* Rating section */}
      {canRate && (
        <section className="flex flex-col gap-3 border-t pt-4">
          <h2 className="text-sm font-semibold">Group rating</h2>

          {average_rating !== null ? (
            <div className="flex flex-col gap-1">
              <RatingStars value={average_rating} />
              <p className="text-xs text-muted-foreground">{rating_count} rating{rating_count !== 1 ? "s" : ""} · average {average_rating.toFixed(1)} / 10</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No ratings yet — be the first!</p>
          )}

          {showPasswordGate && !token && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm font-medium mb-3">Rating requires the group password for this group</p>
              <PasswordGate
                slug={slug}
                onAuthenticated={(t) => { setToken(t); setShowPasswordGate(false); }}
              />
            </div>
          )}

          {(!showPasswordGate || token) && (
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                {ratingSaved
                  ? `Your rating: ${userRating}/10`
                  : ratingMode === "private" && !token
                  ? "Group password required to rate"
                  : "Rate this book:"}
              </p>

              {(ratingMode === "public" || token) && (
                <RatingStars
                  value={userRating}
                  interactive
                  onRate={submitRating}
                />
              )}

              {ratingMode === "private" && !token && (
                <Button size="sm" variant="outline" onClick={() => setShowPasswordGate(true)}>
                  Enter group password to rate
                </Button>
              )}

              {ratingError && <p className="text-sm text-destructive">{ratingError}</p>}
              {ratingSaved && <p className="text-sm text-green-600 dark:text-green-400">Rating saved!</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
