"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Props = {
  token: string;
  circle: { id: string; slug: string; name: string };
  locale: string;
  user: { id: string } | null;
  expired: boolean;
  limitReached: boolean;
  alreadyMember: boolean;
};

export function JoinClient({ token, circle, locale, user, expired, limitReached, alreadyMember }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<"google" | "apple" | null>(null);

  const invalid = expired || limitReached;

  async function handleJoin() {
    setJoining(true);
    setError(null);
    const res = await fetch(`/api/circles/${circle.slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      router.push(`/${locale}/${circle.slug}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setJoining(false);
    }
  }

  async function handleSignIn(provider: "google" | "apple") {
    setAuthLoading(provider);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const next = `/${locale}/join/${token}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-6 py-3">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-serif text-base font-bold tracking-wide">Sofiacirkel</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">

          {/* Circle avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="font-serif text-3xl font-bold text-primary">
              {circle.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {invalid ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-serif text-2xl font-bold">
                  {expired ? "Link has expired" : "Link no longer valid"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {expired
                    ? "This invite link has expired. Ask the circle owner to send a new one."
                    : "This invite link has already been used its maximum number of times."}
                </p>
              </div>
              <Link
                href={`/${locale}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Sofiacirkel
              </Link>
            </>
          ) : alreadyMember ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-serif text-2xl font-bold">You're already in</h1>
                <p className="text-muted-foreground text-sm">
                  You're already a member of <span className="font-medium text-foreground">{circle.name}</span>.
                </p>
              </div>
              <Link
                href={`/${locale}/${circle.slug}`}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity text-center"
              >
                Go to {circle.name}
              </Link>
            </>
          ) : user ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-serif text-2xl font-bold">You're invited</h1>
                <p className="text-muted-foreground text-sm">
                  Join <span className="font-medium text-foreground">{circle.name}</span> to read and rate books together.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? "Joining…" : `Join ${circle.name}`}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-serif text-2xl font-bold">You're invited</h1>
                <p className="text-muted-foreground text-sm">
                  Sign in to join <span className="font-medium text-foreground">{circle.name}</span>.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => handleSignIn("google")}
                  disabled={!!authLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.6 0 19-7.7 19-18.5 0-1.2-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.5 29.3 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
                    <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.6-3.4-11.2-8L6.2 33c3.3 5.7 9.8 10.5 17.8 10.5z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 36 44 30.5 44 24c0-1.2-.1-2.7-.4-4z"/>
                  </svg>
                  {authLoading === "google" ? "Redirecting…" : "Continue with Google"}
                </button>
                <button
                  onClick={() => handleSignIn("apple")}
                  disabled={!!authLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 407.7 0 336.2 0 268.1c0-119.1 77.7-181.8 154.1-181.8 41.3 0 75.9 27.3 101.6 27.3 24.4 0 62.8-29 112.6-29 18.1 0 74.2 1.6 113.4 54.4zM549.3 84.3c-34.7 38.9-92.1 67.7-148.5 67.7-3.2 0-6.4-.3-9.6-.9 1-69.6 54.2-123.7 82.5-150.5 34.7-32.8 96.6-56.4 142.2-56.4 2.6 0 5.2.3 7.7.9-1.6 68.7-48 131.2-74.3 139.2z"/>
                  </svg>
                  {authLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
