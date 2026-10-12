import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { LandingClient } from "./LandingClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sv = locale === "sv";
  return {
    title: sv ? "Sofiacirkel — Spåra din läsning" : "Sofiacirkel — Track your reading",
    description: sv
      ? "Spara det du vill läsa. Minns det du läst. Inspireras av andras öppna cirklar."
      : "Save what you want to read. Remember what you've read. Find inspiration in other people's open circles.",
    openGraph: {
      title: sv ? "Sofiacirkel — Spåra din läsning" : "Sofiacirkel — Track your reading",
      description: sv
        ? "Skapa en cirkel, betygsätt böcker och utforska andras läslistor."
        : "Create a circle, rate books, and explore other people's reading lists.",
      url: `https://sofiacirkel.com/${locale}`,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getUser();
  const supabase = supabaseService();

  type RawCircleBook = {
    status: string;
    books: { cover_url: string | null; title: string } | null;
  };

  function shapeCircle(c: { slug: string; name: string; circle_books: unknown }) {
    const books = (c.circle_books as unknown as RawCircleBook[]) ?? [];
    return {
      slug: c.slug,
      name: c.name,
      read_count: books.filter((b) => b.status === "read").length,
      want_count: books.filter((b) => b.status === "want_to_read").length,
      covers: books
        .filter((b) => b.books?.cover_url)
        .slice(0, 4)
        .map((b) => ({ title: b.books?.title ?? "", cover_url: b.books?.cover_url ?? null })),
    };
  }

  // Fetch user's own circles if signed in
  let userCircles: ReturnType<typeof shapeCircle>[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circles(slug, name, circle_books(status, books(cover_url, title)))")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    userCircles = (memberships ?? [])
      .map((m) => m.circles as unknown as { slug: string; name: string; circle_books: unknown } | null)
      .filter(Boolean)
      .map((c) => shapeCircle(c!));
  }

  // Fetch all circles for public discovery
  const { data: circlesRaw } = await supabase
    .from("circles")
    .select("slug, name, circle_books(status, books(cover_url, title))")
    .order("created_at", { ascending: false })
    .limit(50);

  const circles = (circlesRaw ?? []).map(shapeCircle);

  return (
    <LandingClient
      user={user}
      circles={circles}
      userCircles={userCircles}
      locale={locale}
    />
  );
}
