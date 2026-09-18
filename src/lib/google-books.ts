import type { GoogleBooksResult } from "@/types";

const BASE = "https://www.googleapis.com/books/v1";

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  categories?: string[];
  publishedDate?: string;
  pageCount?: number;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  industryIdentifiers?: { type: string; identifier: string }[];
}

interface GoogleBooksVolume {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

function toResult(volume: GoogleBooksVolume): GoogleBooksResult {
  const v = volume.volumeInfo;
  const cover =
    v.imageLinks?.thumbnail?.replace("http://", "https://") ??
    v.imageLinks?.smallThumbnail?.replace("http://", "https://") ??
    null;

  const year = v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) : null;

  return {
    google_books_id: volume.id,
    title: v.title ?? "Unknown title",
    author: v.authors?.join(", ") ?? null,
    cover_url: cover,
    description: v.description ?? null,
    genre: v.categories?.[0] ?? null,
    published_year: isNaN(year!) ? null : year,
    page_count: v.pageCount ?? null,
  };
}

export async function searchBooks(query: string): Promise<GoogleBooksResult[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: "10",
    key: process.env.GOOGLE_BOOKS_API_KEY!,
  });

  const res = await fetch(`${BASE}/volumes?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data: GoogleBooksResponse = await res.json();
  return (data.items ?? []).map(toResult);
}

export async function getBook(googleBooksId: string): Promise<GoogleBooksResult | null> {
  const res = await fetch(
    `${BASE}/volumes/${googleBooksId}?key=${process.env.GOOGLE_BOOKS_API_KEY!}`
  );
  if (!res.ok) return null;
  const volume: GoogleBooksVolume = await res.json();
  return toResult(volume);
}
