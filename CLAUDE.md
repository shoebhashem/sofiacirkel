# Sofiacirkel – Claude Code Context

## What This Is
A multi-tenant reading platform. Anyone can create a circle; each circle tracks books read/want-to-read and allows ratings. Circles are publicly listed on the landing page — anyone can browse for inspiration without logging in. Creating or joining a circle requires a Google or Apple account.

**Domain**: sofiacirkel.com  
**Previous name**: Bokklubben (now fully rebranded to Sofiacirkel)

## Terminology — IMPORTANT
- **Circle** (Swedish: *Cirkel*) — never "group" or "club"
- **Member** — anyone in a circle; all members have equal rights (add/remove books, rename circle)
- A circle can have one person (personal reading tracker) or many

## URL Structure
- `/[locale]` — landing page: discover circles, sign in
- `/[locale]/[slug]` — a circle's page (book lists, ratings)
- `/[locale]/[slug]/books/[bookId]` — book detail view
- `/auth/callback` — Supabase OAuth callback (no locale prefix)

## Tech Stack
| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router (TypeScript) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth — Google + Apple OAuth |
| Styling | Tailwind CSS + shadcn/ui |
| i18n | next-intl (Swedish + English to start) |
| Book data | Google Books API |
| Hosting | Netlify |

**Removed**: bcryptjs, jose (JWT), group passwords — replaced by Supabase Auth

## Auth Model — IMPORTANT
- **No passwords anywhere.** Auth is Google or Apple OAuth via Supabase Auth.
- First login auto-creates a profile row in `profiles`.
- Session is managed by Supabase (`@supabase/ssr`) — cookies, not localStorage.
- Browsing circles and books: **no login required** (public read).
- Creating a circle, joining a circle, adding/removing books, rating: **login required**.
- All circle members have **equal rights** — no admin/member role distinction (v1).

## Rating System
- Scale: 1–10
- One rating per user per book per circle (enforced by `UNIQUE (circle_book_id, user_id)` in DB)
- Ratings are tied to user accounts, not devices

## i18n
- Library: **next-intl**
- Supported locales: `sv` (Swedish, default), `en` (English)
- All UI strings live in `messages/sv.json` and `messages/en.json`
- Auto-detect locale from browser `Accept-Language` header on first visit
- URL prefix: `/sv/...`, `/en/...`
- Adding a new language = add a new JSON file + update `i18n.ts`

## Coding Conventions
- TypeScript strict mode — no `any`
- All data fetching in Server Components or API Route Handlers; no client-side DB calls
- Tailwind only for styling — no inline styles, no CSS modules
- shadcn/ui for all interactive components
- File naming: `kebab-case` for files, `PascalCase` for components
- Server actions or API routes for mutations; never expose Supabase service key to client
- Environment variables: `NEXT_PUBLIC_` prefix only for truly public values
- **Optimize DB queries** — minimize reads/writes to stay within Supabase free tier; cache aggressively; never fetch more columns than needed

## Environment Variables (see .env.local.example)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only
- `GOOGLE_BOOKS_API_KEY` — server only
- `NEXT_PUBLIC_SITE_URL` — for OAuth redirect URLs

**Removed**: `JWT_SECRET` (no longer needed)

## Running Locally
```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev                          # http://localhost:3000
```

## Deployment
Push to `main` → Netlify auto-deploys (configured via `netlify.toml`). Set env vars in Netlify dashboard.

## Key Architectural Decisions
1. **Supabase Auth (OAuth only)** — Google + Apple; no passwords anywhere; session via cookies
2. **Shared book catalog** — `books` table is global (keyed by Google Books ID); `circle_books` is the per-circle join
3. **Account-based ratings** — `UNIQUE (circle_book_id, user_id)`; one rating per user per book per circle
4. **Supabase RLS disabled** — all DB access via server-side routes using service role key; no direct client DB access
5. **Google Books as source of truth** — book metadata fetched once and cached in `books` table; not re-fetched per request
6. **Equal permissions** — all circle members can add/remove books and rename the circle (no role distinction in v1)
7. **Public browsing** — circles and their books are publicly readable; auth only required for mutations
8. **i18n from day one** — next-intl with locale prefix in URL; sv default, en secondary

## Database Schema (v2 — clean start)
```sql
profiles          -- extends auth.users; display_name, avatar_url
circles           -- id, slug, name, created_by, created_at
circle_members    -- circle_id + user_id (PK); joined_at
invite_links      -- id, circle_id, token, expires_at, max_uses, use_count
books             -- id (Google Books ID), title, authors[], cover_url, description, published_year, page_count, cached_at
circle_books      -- id, circle_id, book_id, added_by, status (read|want_to_read), added_at; UNIQUE(circle_id, book_id)
ratings           -- id, circle_book_id, user_id, rating (1–10), created_at, updated_at; UNIQUE(circle_book_id, user_id)
```

## File Map
```
messages/
  sv.json                         # Swedish UI strings
  en.json                         # English UI strings
src/
  app/
    auth/callback/route.ts        # Supabase OAuth callback
    [locale]/
      layout.tsx                  # i18n provider
      page.tsx                    # Landing — public circle discovery
      [slug]/
        page.tsx                  # Circle page
        books/[bookId]/page.tsx   # Book detail
  api/
    circles/route.ts              # POST create circle
    circles/[slug]/route.ts       # GET circle
    circles/[slug]/books/route.ts # GET/POST books
    circles/[slug]/books/[gbId]/route.ts  # DELETE book
    circles/[slug]/invite/route.ts        # POST create invite link
    circles/[slug]/join/route.ts          # POST join via invite token
    books/search/route.ts         # Google Books proxy
    ratings/route.ts              # POST/PUT rating
  components/
    BookCard.tsx
    BookSearch.tsx
    RatingStars.tsx
    CircleHeader.tsx
    SignInButton.tsx
    ui/                           # shadcn primitives
  lib/
    supabase/client.ts
    supabase/server.ts
    google-books.ts
    utils.ts
  i18n.ts                         # next-intl config
  middleware.ts                   # locale detection + auth guards
  types/index.ts
docs/
  architecture.md
  supabase-schema.sql
```
