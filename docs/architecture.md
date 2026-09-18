# Bokklubben – Architecture

## Overview
Multi-tenant book club platform. Each group is an independent tenant identified by a URL slug. There are no user accounts — access is controlled by a **group password** shared among group members.

---

## Data Model

```sql
-- One row per book club group
groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,       -- URL-safe slug, e.g. "readers2026"
  name          text NOT NULL,              -- display name
  password_hash text NOT NULL,             -- bcrypt hash of the group password
  rating_mode   text NOT NULL DEFAULT 'public',  -- 'public' | 'private'
  created_at    timestamptz DEFAULT now()
)

-- Canonical book catalog (shared across all groups; one row per Google Books ID)
books (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_books_id text UNIQUE NOT NULL,
  title           text NOT NULL,
  author          text,
  cover_url       text,
  description     text,
  genre           text,
  published_year  int,
  page_count      int
)

-- Per-group book membership: links a group to a book with a status
group_books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id)  ON DELETE CASCADE,
  book_id     uuid REFERENCES books(id),
  status      text NOT NULL,              -- 'want_to_read' | 'already_read'
  added_at    timestamptz DEFAULT now(),
  finished_at timestamptz,                -- set when status moves to already_read
  UNIQUE(group_id, book_id)
)

-- Ratings: per group-book, per anonymous device
ratings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_book_id uuid REFERENCES group_books(id) ON DELETE CASCADE,
  rater_id      text NOT NULL,            -- anonymous UUID from localStorage
  stars         int NOT NULL CHECK (stars BETWEEN 1 AND 10),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(group_book_id, rater_id)         -- one rating per device per book
)
```

---

## Multi-Tenant Routing

Next.js dynamic route `app/[slug]` handles all group pages. The slug is the primary tenant identifier.

- Groups are **unlisted** — not searchable from the landing page. You need the URL.
- Slug rules: lowercase alphanumeric + hyphens, 3–40 characters.
- 404 is returned for unknown slugs.

---

## Group Password Auth

**Terminology:** Always called "group password" — it is shared among all members, not personal.

### Flow

```
User enters group password
  → POST /api/groups/[slug]/auth  { password }
  → Server: bcrypt.compare(password, groups.password_hash)
  → Server: sign JWT  { slug, iat, exp: now+30days }  with JWT_SECRET
  → Client: store JWT in localStorage as  bookclub_[slug]_token
  → Client: send  Authorization: Bearer <token>  on admin requests
  → Server: verify JWT signature + slug match on every protected route
```

### Why JWT in localStorage
- This is a casual community tool, not a sensitive system
- JWT is stateless — no session table needed
- 30-day expiry balances convenience and security
- If the group password is changed, old JWTs remain valid until expiry (acceptable for this use case; admin can re-share new password)

### Protected operations (group password required)
- Add/remove books
- Move book from want-to-read → already-read
- Change group settings (rating mode)
- Rate books (if `rating_mode = 'private'`)

---

## Book Search & Storage

1. Admin enters title/author/ISBN in BookSearch component
2. Client calls `GET /api/books/search?q=...` (server-side proxy — API key never exposed)
3. Server calls Google Books API, returns top results
4. Admin selects a result
5. `POST /api/groups/[slug]/books` — server upserts into `books` (by `google_books_id`), then inserts into `group_books`
6. Book metadata is stored once and never re-fetched (Google Books data rarely changes)

### Google Books API Setup
- Go to https://console.cloud.google.com
- Create a project → Enable "Books API"
- Create an API key (API & Services → Credentials)
- No credit card required for the free tier (1000 requests/day)
- Add key to `.env.local` as `GOOGLE_BOOKS_API_KEY`

---

## Rating Access System

| `rating_mode` | Who can rate |
|---|---|
| `public` | Anyone visiting the group page |
| `private` | Only members who have entered the group password |

- Admin sets this during group creation; can change it in group settings at any time
- Switching from `public` → `private` does not remove existing ratings, but new ratings require the group password from that point on
- Rating uniqueness is enforced by `rater_id` (anonymous UUID in localStorage) — one rating per device per book per group
- Scale: 1–10 stars

---

## Supabase Setup

- All DB access goes through server-side API routes using `SUPABASE_SERVICE_ROLE_KEY`
- No Supabase RLS policies — security is handled at the API layer
- No Supabase Auth — group password JWT is custom
- Client-side Supabase client (`NEXT_PUBLIC_` keys) is only used for any future realtime subscriptions; never for writes

---

## Netlify Deployment

- `netlify.toml` configures Next.js runtime
- Push to `main` branch → automatic deploy
- Environment variables set in Netlify dashboard (not committed to repo)
- Build command: `npm run build`
- Publish directory: `.next`
