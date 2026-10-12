export type BookStatus = "want_to_read" | "read";

export interface Circle {
  id: string;
  slug: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface CirclePreview {
  slug: string;
  name: string;
  read_count: number;
  want_count: number;
  covers: Array<{ title: string; cover_url: string | null }>;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  description: string | null;
  published_year: number | null;
  page_count: number | null;
}

export interface CircleBook {
  id: string;
  circle_id: string;
  book_id: string;
  status: BookStatus;
  added_by: string | null;
  added_at: string;
  book: Book;
  circle_rating: number | null;
  community_rating: number | null;
  rating_count: number;
}

export interface Rating {
  id: string;
  circle_book_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface GoogleBooksResult {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  description: string | null;
  published_year: number | null;
  page_count: number | null;
}
