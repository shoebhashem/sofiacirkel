import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";
import { CirclePageClient } from "./CirclePageClient";
import type { CircleBook, Book } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const db = supabaseService();
  const { data: circle } = await db
    .from("circles")
    .select("id, name, circle_books(status)")
    .eq("slug", slug)
    .single();

  if (!circle) return {};

  type RawCB = { status: string };
  const readCount = (circle.circle_books as unknown as RawCB[]).filter(b => b.status === "read").length;
  const sv = locale === "sv";
  const desc = sv
    ? `${circle.name} har läst ${readCount} böcker. Utforska deras lista på Sofiacirkel.`
    : `${circle.name} has read ${readCount} books. Explore their list on Sofiacirkel.`;

  return {
    title: circle.name,
    description: desc,
    openGraph: {
      title: `${circle.name} · Sofiacirkel`,
      description: desc,
      url: `https://sofiacirkel.com/${locale}/${slug}`,
    },
  };
}

export type CircleMember = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default async function CirclePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = supabaseService();
  const user = await getUser();

  // Fetch circle
  const { data: circle } = await supabase
    .from("circles")
    .select("id, slug, name, created_by, created_at")
    .eq("slug", slug)
    .single();

  if (!circle) notFound();

  // Fetch books + ratings in one query
  const { data: circleBooksRaw } = await supabase
    .from("circle_books")
    .select(`
      id, status, added_by, added_at,
      books(id, title, authors, cover_url, published_year, page_count),
      ratings(rating, user_id)
    `)
    .eq("circle_id", circle.id)
    .order("added_at", { ascending: false });

  // Fetch members with profiles
  const { data: membersRaw } = await supabase
    .from("circle_members")
    .select("user_id, profiles(display_name, avatar_url)")
    .eq("circle_id", circle.id);

  type RawMember = { user_id: string; profiles: { display_name: string | null; avatar_url: string | null } | null };
  const members: CircleMember[] = (membersRaw ?? []).map((m) => {
    const raw = m as unknown as RawMember;
    return {
      user_id: raw.user_id,
      display_name: raw.profiles?.display_name ?? null,
      avatar_url: raw.profiles?.avatar_url ?? null,
    };
  });

  // Check membership
  const isMember = user
    ? await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("circle_id", circle.id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => !!data)
    : false;

  type RawRating = { rating: number; user_id: string };

  const circleBooks: (CircleBook & { user_rating: number | null })[] = (
    circleBooksRaw ?? []
  ).map((cb) => {
    const ratings = (cb.ratings as unknown as RawRating[]) ?? [];
    const circleRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10
          ) / 10
        : null;

    return {
      id: cb.id,
      circle_id: circle.id,
      book_id: (cb.books as unknown as Book).id,
      status: cb.status as "read" | "want_to_read",
      added_by: cb.added_by,
      added_at: cb.added_at,
      book: cb.books as unknown as Book,
      circle_rating: circleRating,
      community_rating: null,
      rating_count: ratings.length,
      user_rating: user
        ? (ratings.find((r) => r.user_id === user.id)?.rating ?? null)
        : null,
    };
  });

  return (
    <CirclePageClient
      circle={{ id: circle.id, slug: circle.slug, name: circle.name, created_by: circle.created_by, created_at: circle.created_at }}
      circleBooks={circleBooks}
      members={members}
      user={user}
      isMember={isMember}
      locale={locale}
    />
  );
}
