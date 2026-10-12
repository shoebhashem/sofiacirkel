import type { MetadataRoute } from "next";
import { supabaseService } from "@/lib/supabase/service";

const BASE = "https://sofiacirkel.com";
const LOCALES = ["sv", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = supabaseService();

  // All public circles
  const { data: circles } = await db
    .from("circles")
    .select("slug, created_at");

  // All circle_books for book detail pages
  const { data: circleBooks } = await db
    .from("circle_books")
    .select("id, added_at, circles(slug)");

  type RawCircle = { slug: string };

  const entries: MetadataRoute.Sitemap = [];

  // Landing pages
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE}/${locale}`,
      changeFrequency: "daily",
      priority: 1.0,
    });
  }

  // Circle pages
  for (const circle of circles ?? []) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/${circle.slug}`,
        lastModified: circle.created_at,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Book detail pages
  for (const cb of circleBooks ?? []) {
    const circleSlug = (cb.circles as unknown as RawCircle)?.slug;
    if (!circleSlug) continue;
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/${circleSlug}/books/${cb.id}`,
        lastModified: cb.added_at,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
