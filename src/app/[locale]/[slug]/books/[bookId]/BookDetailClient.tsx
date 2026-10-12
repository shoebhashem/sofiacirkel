"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SignInDialog } from "@/components/SignInDialog";
import { UserMenu } from "@/components/UserMenu";
import { circleSwatch } from "@/lib/theme";
import type { User } from "@supabase/supabase-js";
import type { Book } from "@/types";

type Props = {
  locale: string;
  slug: string;
  circleName: string;
  circleBookId: string;
  book: Book;
  status: "read" | "want_to_read";
  circleRating: number | null;
  ratingCount: number;
  userRating: number | null;
  isMember: boolean;
  user: User | null;
};

export function BookDetailClient({
  locale,
  slug,
  circleName,
  circleBookId,
  book,
  status,
  circleRating,
  ratingCount,
  userRating: initialUserRating,
  isMember,
  user,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [savedRating, setSavedRating] = useState<number | null>(initialUserRating);
  const [saving, setSaving] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const swatch = circleSwatch(book.title);

  async function handleRemove() {
    if (!confirm(`Ta bort "${book.title}" från ${circleName}?`)) return;
    setRemoving(true);
    const res = await fetch(`/api/circles/${slug}/books/${circleBookId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/${locale}/${slug}`);
    } else {
      setRemoving(false);
    }
  }

  async function submitRating(value: number) {
    if (!user) { setSignInOpen(true); return; }
    setSaving(true);
    setRatingError(null);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleBookId, rating: value }),
    });
    if (res.ok) {
      setSavedRating(value);
    } else {
      const d = await res.json().catch(() => ({}));
      setRatingError(d.error ?? "Failed to save rating.");
    }
    setSaving(false);
  }

  const displayRating = hoveredRating ?? savedRating;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors shrink-0"
            >
              <div className="w-6 h-6 rounded-md bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
                <Image src="/logo.png" alt="" width={24} height={24} className="object-contain" />
              </div>
              <span className="font-serif font-semibold">Sofiacirkel</span>
            </Link>
            <span className="opacity-40">/</span>
            <Link
              href={`/${locale}/${slug}`}
              className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-xs"
            >
              {circleName}
            </Link>
            <span className="opacity-40 shrink-0">/</span>
            <span className="text-foreground truncate max-w-[120px] sm:max-w-xs">{book.title}</span>
          </nav>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity shrink-0"
            >
              {t("auth.signIn")}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col sm:flex-row gap-8">

          {/* ── Cover ────────────────────────────────────────────── */}
          <div className="shrink-0 self-start">
            <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-md">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  fill
                  sizes="(max-width: 640px) 144px, 176px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: swatch.bg }}
                >
                  <span className="font-serif text-4xl font-bold" style={{ color: swatch.fg }}>
                    {book.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Info ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 flex-1 min-w-0">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-wrap-balance">
                {book.title}
              </h1>
              {book.authors.length > 0 && (
                <p className="text-muted-foreground mt-1.5 text-base">
                  {book.authors.join(", ")}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                {book.published_year && <span>{book.published_year}</span>}
                {book.page_count && (
                  <>
                    {book.published_year && <span className="opacity-40">·</span>}
                    <span>{book.page_count} sidor</span>
                  </>
                )}
                <span className="opacity-40">·</span>
                <span className={status === "read" ? "text-sage font-medium" : "text-muted-foreground"}>
                  {status === "read" ? t("circle.read") : t("circle.wantToRead")}
                </span>
              </div>

              {isMember && (
                <div className="mt-3">
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                    {removing ? "Tar bort…" : "Ta bort från cirkel"}
                  </button>
                </div>
              )}
            </div>

            {/* ── Circle rating summary ───────────────────────────── */}
            {status === "read" && (
              <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-card border border-border">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-serif text-primary">
                    {circleRating !== null ? circleRating.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{t("circle.circleRating")}</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{ratingCount}</span>
                  <span className="text-xs text-muted-foreground">
                    {ratingCount === 1 ? "betyg" : "betyg"}
                  </span>
                </div>
              </div>
            )}

            {/* ── Rate this book ──────────────────────────────────── */}
            {(isMember || !user) && status === "read" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">
                  {savedRating ? t("book.yourRating") : t("book.rateThis")}
                </p>

                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                    <button
                      key={val}
                      disabled={saving}
                      onMouseEnter={() => setHoveredRating(val)}
                      onClick={() => submitRating(val)}
                      className={`w-8 h-8 rounded-md text-sm font-semibold transition-all duration-100 border ${
                        displayRating !== null && val <= displayRating
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
                      } disabled:opacity-50`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {displayRating && (
                  <p className="text-xs text-muted-foreground">
                    {hoveredRating
                      ? `Betygsätt ${hoveredRating}/10`
                      : `Ditt betyg: ${savedRating}/10`}
                  </p>
                )}

                {ratingError && (
                  <p className="text-sm text-destructive">{ratingError}</p>
                )}
              </div>
            )}

            {/* ── Description ─────────────────────────────────────── */}
            {book.description && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Om boken
                </p>
                <p className="text-sm leading-relaxed text-foreground/80 font-reading">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tillbaka till {circleName}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy policy
            </Link>
            <a
              href="mailto:shoeb.hashem@gmail.com"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.contact")}
            </a>
          </div>
        </div>
      </footer>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
