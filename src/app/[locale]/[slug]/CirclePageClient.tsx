"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SignInDialog } from "@/components/SignInDialog";
import { GlowButton } from "@/components/GlowButton";
import { UserMenu } from "@/components/UserMenu";
import { BookSearch } from "@/components/BookSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { circleSwatch } from "@/lib/theme";
import type { User } from "@supabase/supabase-js";
import type { Circle, CircleBook, GoogleBooksResult } from "@/types";
import type { CircleMember } from "./page";

type Props = {
  circle: Circle;
  circleBooks: (CircleBook & { user_rating: number | null })[];
  members: CircleMember[];
  user: User | null;
  isMember: boolean;
  locale: string;
};

export function CirclePageClient({ circle, circleBooks, members, user, isMember, locale }: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<"read" | "want_to_read">("read");
  const [signInOpen, setSignInOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isLastMember = members.length === 1;

  async function handleLeave() {
    setLeaving(true);
    const res = await fetch(`/api/circles/${circle.slug}/members`, { method: "DELETE" });
    if (res.ok) {
      const { deleted } = await res.json();
      // Navigate away — circle gone or user no longer a member
      window.location.href = `/${locale}` + (deleted ? "" : "");
    } else {
      setLeaving(false);
      setLeaveOpen(false);
    }
  }

  const visibleBooks = circleBooks.filter((b) => !removedIds.has(b.id));
  const readBooks = visibleBooks.filter((b) => b.status === "read");
  const wantBooks = visibleBooks.filter((b) => b.status === "want_to_read");
  const shown = tab === "read" ? readBooks : wantBooks;

  async function handleRemoveBook(circleBookId: string) {
    setRemovedIds((prev) => new Set(prev).add(circleBookId));
    const res = await fetch(`/api/circles/${circle.slug}/books/${circleBookId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Undo optimistic removal on failure
      setRemovedIds((prev) => { const next = new Set(prev); next.delete(circleBookId); return next; });
    }
  }

  async function handleAddBook(book: GoogleBooksResult, status: "read" | "want_to_read") {
    if (!user) { setAddOpen(false); setSignInOpen(true); return; }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/circles/${circle.slug}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, status }),
      });
      if (!res.ok) {
        const d = await res.json();
        setAddError(d.error ?? "Failed to add book.");
        return;
      }
      setAddOpen(false);
      window.location.reload();
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  async function handleCreateInvite() {
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/circles/${circle.slug}/invite`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) setInviteLink(data.url);
    } catch {}
    finally { setInviteLoading(false); }
  }

  async function copyInvite() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <div className="w-6 h-6 rounded bg-[#111] overflow-hidden flex items-center justify-center">
              <Image src="/logo.png" alt="" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-serif text-sm font-semibold">Sofiacirkel</span>
          </Link>

          <div className="flex items-center gap-3">
            {isMember && (
              <button
                onClick={() => setInviteOpen(true)}
                className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors"
              >
                {t("circle.invite")}
              </button>
            )}
            {user ? (
              <UserMenu user={user} />
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {t("auth.signIn")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

        {/* ── Circle header ──────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              {circle.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {readBooks.length > 0
                ? t("circle.read") + ` · ${readBooks.length} böcker`
                : ""}
              {wantBooks.length > 0
                ? (readBooks.length > 0 ? "  ·  " : "") +
                  t("circle.wantToRead") + ` · ${wantBooks.length}`
                : ""}
            </p>
          </div>

          {isMember && (
            <GlowButton
              onClick={() => setAddOpen(true)}
              className="px-4 py-2"
              wrapClassName="shrink-0"
            >
              + {t("circle.addBook")}
            </GlowButton>
          )}
          {!user && (
            <button
              onClick={() => setSignInOpen(true)}
              className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors shrink-0"
            >
              {t("auth.signIn")}
            </button>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-border">
          {(["read", "want_to_read"] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t_
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t_ === "read" ? t("circle.read") : t("circle.wantToRead")}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {t_ === "read" ? readBooks.length : wantBooks.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Book grid ──────────────────────────────────────────── */}
        {shown.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {tab === "read" ? t("circle.emptyRead") : t("circle.emptyWant")}
            </p>
            {isMember && (
              <GlowButton
                onClick={() => setAddOpen(true)}
                className="px-4 py-2"
                wrapClassName="mt-4"
              >
                + {t("circle.addBook")}
              </GlowButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((cb) => (
              <BookRow
                key={cb.id}
                circleBook={cb}
                locale={locale}
                slug={circle.slug}
                isMember={isMember}
                onRemove={handleRemoveBook}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Members + leave ────────────────────────────────────── */}
      <div className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t("circle.membersTitle")}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {members.map((m) => (
                <div key={m.user_id} className="relative group/avatar">
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt={m.display_name ?? ""}
                      width={28}
                      height={28}
                      className="rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {(m.display_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {m.display_name && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-foreground text-background text-[11px] whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-opacity">
                      {m.display_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isMember && (
            <button
              onClick={() => setLeaveOpen(true)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {t("circle.leaveCircle")}
            </button>
          )}
        </div>
      </div>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <span className="font-serif italic text-xs text-muted-foreground">Sofiacirkel</span>
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

      {/* ── Leave dialog ───────────────────────────────────────── */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {isLastMember ? t("circle.leaveLastTitle") : t("circle.leaveConfirmTitle")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isLastMember ? t("circle.leaveLastBody") : t("circle.leaveConfirmBody")}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setLeaveOpen(false)}
              disabled={leaving}
              className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              {t("circle.cancel")}
            </button>
            <button
              onClick={handleLeave}
              disabled={leaving}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-opacity disabled:opacity-50 ${
                isLastMember
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {leaving ? "…" : t("circle.leaveButton")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sign-in dialog ─────────────────────────────────────── */}
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />

      {/* ── Add book dialog ─────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("circle.addBook")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-1">
            <BookSearch
              onSelect={(book) => handleAddBook(book, tab === "read" ? "read" : "want_to_read")}
            />
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            {adding && <p className="text-sm text-muted-foreground">Lägger till…</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Invite dialog ──────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("invite.title")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {!inviteLink ? (
              <button
                onClick={handleCreateInvite}
                disabled={inviteLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {inviteLoading ? "Skapar länk…" : t("invite.linkCreated")}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t("invite.linkCreated")}</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 text-xs border border-border rounded-md px-3 py-2 bg-muted text-foreground"
                  />
                  <button
                    onClick={copyInvite}
                    className="px-3 py-2 text-xs border border-border rounded-md hover:bg-muted transition-colors shrink-0"
                  >
                    {copied ? t("invite.copied") : t("invite.copy")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookRow({
  circleBook,
  locale,
  slug,
  isMember,
  onRemove,
}: {
  circleBook: CircleBook & { user_rating: number | null };
  locale: string;
  slug: string;
  isMember: boolean;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations();
  const { book, circle_rating, rating_count } = circleBook;
  const swatch = circleSwatch(book.title);

  return (
    <div className="group relative">
      <Link
        href={`/${locale}/${slug}/books/${circleBook.id}`}
        className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200 block"
      >
      {/* Cover */}
      <div className="relative w-14 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: swatch.bg }}
          >
            <span className="font-serif text-lg font-bold" style={{ color: swatch.fg }}>
              {book.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </p>
        {book.authors.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.authors.join(", ")}
          </p>
        )}
        {book.published_year && (
          <p className="text-xs text-muted-foreground">{book.published_year}</p>
        )}

        {circleBook.status === "read" && (
          <div className="mt-auto pt-2 flex items-center gap-2">
            {circle_rating !== null ? (
              <>
                <span className="text-xs font-semibold text-primary">
                  {circle_rating.toFixed(1)}
                  <span className="text-muted-foreground font-normal">/10</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("circle.circleRating")}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Inget betyg ännu</span>
            )}
            {rating_count > 0 && (
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {rating_count} {rating_count === 1 ? "betyg" : "betyg"}
              </span>
            )}
          </div>
        )}
      </div>
      </Link>

      {isMember && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(circleBook.id); }}
          title="Ta bort bok"
          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 flex items-center justify-center"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}
