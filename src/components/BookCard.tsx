"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./RatingStars";
import type { GroupBook } from "@/types";

interface BookCardProps {
  groupBook: GroupBook;
  slug: string;
  showRating?: boolean;
}

export function BookCard({ groupBook, slug, showRating = true }: BookCardProps) {
  const { book, average_rating, rating_count, status } = groupBook;

  return (
    <Link href={`/${slug}/books/${groupBook.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md dark:hover:shadow-none dark:hover:ring-1 dark:hover:ring-border">
        <div className="flex gap-3 p-3">
          {/* Cover */}
          <div className="relative w-16 shrink-0 aspect-[2/3] rounded overflow-hidden bg-muted">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                No cover
              </div>
            )}
          </div>

          {/* Info */}
          <CardContent className="p-0 flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
            )}

            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {book.published_year && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {book.published_year}
                </Badge>
              )}
              {book.genre && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                  {book.genre}
                </Badge>
              )}
            </div>

            {showRating && status === "already_read" && (
              <div className="mt-1">
                {average_rating !== null ? (
                  <RatingStars value={average_rating} size="sm" />
                ) : (
                  <p className="text-xs text-muted-foreground">No ratings yet</p>
                )}
                {rating_count > 0 && (
                  <p className="text-xs text-muted-foreground">{rating_count} rating{rating_count !== 1 ? "s" : ""}</p>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
