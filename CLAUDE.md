# Bokklubben – Claude Code Context

## What This Is
A multi-tenant book club platform. Anyone can create a group; each group gets its own URL, tracks books read/want-to-read, and allows ratings. Groups are unlisted (not publicly searchable) — you need the URL to find one.

## URL Structure
- `/` — landing page: create a group or navigate to an existing one
- `/[slug]` — a group's page (book lists, ratings)
- `/[slug]/settings` — group admin settings (group password required)
- `/[slug]/books/[bookId]` — book detail view

## Tech Stack
| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router (TypeScript) |
| Database | Supabase (Postgres) |
| Styling | Tailwind CSS + shadcn/ui |
| Password hashing | bcryptjs |
| Session tokens | jose (JWT HS256) |
| Book data | Google Books API |
| Hosting | Netlify |

## Password Model — IMPORTANT
There are **no user accounts**. Authentication is per-group:
- Each group has one **group password** shared among all members
- The group password is bcrypt-hashed and stored in `groups.password_hash`
- Entering the correct group password issues a signed JWT stored in `localStorage` as `bookclub_[slug]_token`
- All API routes that require auth validate this JWT
- **Always use the phrase "group password"** in UI labels, error messages, comments, and docs — never just "password"

## Rating System
- Scale: 1–10
- One rating per device per book (enforced via `rater_id` UUID in `localStorage`)
- `rating_mode` per group: `'public'` (anyone can rate) | `'private'` (group password required)

## Coding Conventions
- TypeScript strict mode — no `any`
- All data fetching in Server Components or API Route Handlers; no client-side DB calls
- Tailwind only for styling — no inline styles, no CSS modules
- shadcn/ui for all interactive components
- File naming: `kebab-case` for files, `PascalCase` for components
- Server actions or API routes for mutations; never expose Supabase service key to client
- Environment variables: `NEXT_PUBLIC_` prefix only for truly public values

## Environment Variables (see .env.local.example)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never expose to client
- `JWT_SECRET` — server only, used to sign group session tokens
- `GOOGLE_BOOKS_API_KEY` — server only

## Running Locally
```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev                          # http://localhost:3000
```

## Deployment
Push to `main` → Netlify auto-deploys (configured via `netlify.toml`). Set env vars in Netlify dashboard.

## Key Architectural Decisions
1. **No global auth** — group password per group, JWT in localStorage
2. **Shared book catalog** — `books` table is global; `group_books` is the per-group join
3. **Anonymous ratings** — `rater_id` UUID in localStorage; no account needed
4. **Supabase RLS disabled** — all DB access goes through server-side API routes using the service role key; no direct client DB access
5. **Google Books as source of truth** — book metadata is fetched once and cached in DB; not re-fetched per request

## File Map
```
src/
  app/
    page.tsx                    # Landing
    [slug]/page.tsx             # Group page
    [slug]/settings/page.tsx    # Admin settings
    [slug]/books/[bookId]/page.tsx
    api/groups/route.ts         # POST create group
    api/groups/[slug]/route.ts  # GET group
    api/groups/[slug]/auth/route.ts
    api/groups/[slug]/books/route.ts
    api/groups/[slug]/books/[gbId]/route.ts
    api/groups/[slug]/settings/route.ts
    api/books/search/route.ts   # Google Books proxy
    api/ratings/route.ts
  components/
    BookCard.tsx
    BookSearch.tsx
    RatingStars.tsx
    PasswordGate.tsx
    GroupHeader.tsx
    ui/                         # shadcn primitives
  lib/
    supabase/client.ts
    supabase/server.ts
    auth.ts                     # JWT helpers
    google-books.ts
    utils.ts
  types/index.ts
docs/
  architecture.md
```
