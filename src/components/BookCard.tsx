"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "./RatingStars";
import type { CircleBook } from "@/types";

interface BookCardProps {
  circleBook: CircleBook;
  slug: string;
  locale: string;
  onRemove?: () => void;
}

export function BookCard({ circleBook, slug, locale, onRemove }: BookCardProps) {
  const { book, circle_rating, rating_count, status } = circleBook;
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative group/card">
      <Link href={`/${locale}/${slug}/books/${circleBook.id}`} className="block group">
        <div className="flex gap-4 p-4 border border-border hover:shadow-sm transition-shadow">
          <div className="relative w-16 shrink-0 aspect-[2/3] rounded overflow-hidden bg-muted">
            {book.cover_url ? (
              <Image src={book.cover_url} alt={`Cover of ${book.title}`} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                No cover
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1 pr-6">
            <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </p>
            {book.authors.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1">{book.authors.join(", ")}</p>
            )}
            {book.published_year && (
              <p className="text-xs text-muted-foreground">{book.published_year}</p>
            )}
            {status === "read" && (
              <div className="mt-1">
                {circle_rating !== null ? (
                  <RatingStars value={circle_rating} size="sm" />
                ) : (
                  <p className="text-xs text-muted-foreground">No ratings yet</p>
                )}
                {rating_count > 0 && (
                  <p className="text-xs text-muted-foreground">{rating_count} rating{rating_count !== 1 ? "s" : ""}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {onRemove && !confirming && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
          title="Remove from list"
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded transition-all opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}

      {confirming && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-10"
          onClick={(e) => e.preventDefault()}>
          <p className="text-sm font-medium">Remove &ldquo;{book.title}&rdquo;?</p>
          <div className="flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
              className="px-3 py-1.5 text-xs border border-border hover:bg-muted transition-colors">Cancel</button>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove?.(); }}
              className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground hover:opacity-85 transition-opacity">Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}
