import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/google-books";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query too short." }, { status: 400 });
  }

  try {
    const results = await searchBooks(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Book search failed." }, { status: 502 });
  }
}
