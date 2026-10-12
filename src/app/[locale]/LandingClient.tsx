"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SignInDialog } from "@/components/SignInDialog";
import { CreateCircleDialog } from "@/components/CreateCircleDialog";
import { GlowButton } from "@/components/GlowButton";
import { UserMenu } from "@/components/UserMenu";
import { circleSwatch } from "@/lib/theme";
import type { User } from "@supabase/supabase-js";
import type { CirclePreview } from "@/types";

type Props = {
  user: User | null;
  circles: CirclePreview[];
  userCircles: CirclePreview[];
  locale: string;
};

export function LandingClient({ user, circles, userCircles, locale }: Props) {
  const t = useTranslations();
  const [signInOpen, setSignInOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  function handleCtaClick() {
    if (user) setCreateOpen(true);
    else setSignInOpen(true);
  }

  const filtered = circles.filter(
    (c) =>
      search.trim() === "" ||
      c.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-serif text-base font-bold tracking-wide">Sofiacirkel</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <UserMenu user={user} />
              </>
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col gap-16 py-14">

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5 max-w-2xl">
          <h1 className="font-serif text-4xl sm:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-wrap-balance">
            {t("landing.heroTitle")}{" "}
            <span className="rainbow-text">{t("landing.heroTitleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md font-reading">
            {t("landing.heroSubtitle")}
          </p>
          {user && userCircles.length > 0 ? (
            <div className="flex flex-col gap-3 mt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("landing.myCircles")}
              </p>
              <div className="flex flex-wrap gap-2">
                {userCircles.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${locale}/${c.slug}`}
                    className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:border-primary/50 hover:shadow-sm transition-all duration-150"
                  >
                    {c.covers[0]?.cover_url ? (
                      <Image
                        src={c.covers[0].cover_url}
                        alt=""
                        width={20}
                        height={28}
                        className="rounded object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-5 h-7 rounded bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {c.name}
                  </Link>
                ))}
                <button
                  onClick={() => setCreateOpen(true)}
                  className="px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                >
                  + {t("nav.newCircle")}
                </button>
              </div>
            </div>
          ) : (
            <GlowButton
              onClick={handleCtaClick}
              className="px-6 py-3"
              wrapClassName="self-start mt-1"
            >
              {t("landing.cta")}
            </GlowButton>
          )}
        </section>

        {/* ── Discover ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-bold">{t("landing.discover")}</h2>
            <p className="text-sm text-muted-foreground font-reading">
              {t("landing.discoverSubtitle")}
            </p>
          </div>

          <div className="relative max-w-xs">
            <input
              className="w-full border border-border bg-card rounded-md px-3 py-2 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              placeholder={t("landing.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {search
                ? t("landing.noResults", { query: search })
                : t("landing.noCircles")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((c) => (
                <CircleCard key={c.slug} circle={c} locale={locale} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <span className="font-serif italic text-sm text-muted-foreground">Sofiacirkel</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/60">{t("footer.tagline")}</span>
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
      <CreateCircleDialog open={createOpen} onOpenChange={setCreateOpen} locale={locale} />
    </div>
  );
}

function CircleCard({ circle, locale }: { circle: CirclePreview; locale: string }) {
  const t = useTranslations("landing");
  const withCover = circle.covers.filter((c) => c.cover_url);
  const swatch = circleSwatch(circle.name);

  return (
    <Link href={`/${locale}/${circle.slug}`} className="flex flex-col gap-2 group min-w-0">
      <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
        {withCover.length >= 4 ? (
          <div className="grid grid-cols-2 w-full h-full gap-0.5">
            {withCover.slice(0, 4).map((c, i) => (
              <div key={i} className="relative overflow-hidden">
                <Image src={c.cover_url!} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : withCover.length > 0 ? (
          <Image
            src={withCover[0].cover_url!}
            alt={circle.name}
            fill
            sizes="180px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: swatch.bg }}
          >
            <span
              className="font-serif text-4xl font-bold"
              style={{ color: swatch.fg }}
            >
              {circle.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 px-0.5">
        <p className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
          {circle.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {circle.read_count > 0
            ? t("booksRead", { count: circle.read_count })
            : t("noBooks")}
          {circle.want_count > 0
            ? ` · ${t("booksQueued", { count: circle.want_count })}`
            : ""}
        </p>
      </div>
    </Link>
  );
}
