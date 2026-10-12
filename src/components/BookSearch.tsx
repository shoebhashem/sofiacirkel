"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GoogleBooksResult } from "@/types";

interface BookSearchProps {
  onSelect: (book: GoogleBooksResult) => void;
}

export function BookSearch({ onSelect }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBooksResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
    } catch {
      setError("Boksökningen är tillfälligt otillgänglig. Försök igen om några minuter.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search by title, author, or ISBN…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading || query.trim().length < 2} variant="secondary">
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {searched && results.length === 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">No books found. Try a different search.</p>
      )}

      <ul className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {results.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              className="w-full flex gap-3 items-start p-2 rounded-md text-left hover:bg-muted transition-colors"
              onClick={() => {
                onSelect(book);
                setQuery("");
                setResults([]);
                setSearched(false);
              }}
            >
              <div className="relative w-10 aspect-[2/3] shrink-0 rounded overflow-hidden bg-muted">
                {book.cover_url ? (
                  <Image src={book.cover_url} alt={book.title} fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{book.title}</p>
                {book.authors.length > 0 && (
                  <p className="text-xs text-muted-foreground">{book.authors.join(", ")}</p>
                )}
                {book.published_year && (
                  <p className="text-xs text-muted-foreground">{book.published_year}</p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
