export type RatingMode = "public" | "private";
export type BookStatus = "want_to_read" | "already_read";

export interface Group {
  id: string;
  slug: string;
  name: string;
  rating_mode: RatingMode;
  created_at: string;
}

export interface Book {
  id: string;
  google_books_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  published_year: number | null;
  page_count: number | null;
}

export interface GroupBook {
  id: string;
  group_id: string;
  book_id: string;
  status: BookStatus;
  added_at: string;
  finished_at: string | null;
  book: Book;
  average_rating: number | null;
  rating_count: number;
}

export interface Rating {
  id: string;
  group_book_id: string;
  rater_id: string;
  stars: number;
  created_at: string;
}

// Shape returned by Google Books API search
export interface GoogleBooksResult {
  google_books_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  published_year: number | null;
  page_count: number | null;
}
