"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordGate } from "@/components/PasswordGate";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types";

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`bookclub_${slug}_token`);
    if (stored) setToken(stored);

    fetch(`/api/groups/${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.group) setGroup(d.group); })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleRatingModeChange(ratingMode: "public" | "private") {
    if (!token || !group) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/groups/${slug}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ratingMode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save settings.");
    } else {
      setGroup(data.group);
      setSuccess(true);
    }
    setSaving(false);
  }

  if (loading) {
    return <main className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground animate-pulse">Loading…</p></main>;
  }

  if (!token) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16 flex flex-col gap-6">
        <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:underline">← Back to group</Link>
        <h1 className="font-serif text-2xl font-bold">Group settings</h1>
        <p className="text-sm text-muted-foreground">Enter the group password to access settings.</p>
        <PasswordGate
          slug={slug}
          onAuthenticated={(t) => { setToken(t); router.refresh(); }}
        />
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-8 flex flex-col gap-6">
      <Link href={`/${slug}`} className="text-sm text-muted-foreground hover:underline">← Back to {group?.name}</Link>
      <h1 className="font-serif text-2xl font-bold">Group settings</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Who can rate books?</h2>
        <div className="flex gap-2">
          {(["public", "private"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={saving}
              onClick={() => handleRatingModeChange(mode)}
              className={`flex-1 rounded-md border px-3 py-3 text-sm text-left transition-colors ${
                group?.rating_mode === mode
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Badge variant={mode === "public" ? "secondary" : "outline"} className="mb-1">
                {mode === "public" ? "Public" : "Private"}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {mode === "public" ? "Anyone visiting the page" : "Requires the group password"}
              </p>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">Settings saved.</p>}
      </section>

      <section className="flex flex-col gap-2 pt-2 border-t">
        <h2 className="text-sm font-semibold text-muted-foreground">Group info</h2>
        <p className="text-sm">URL: <code className="font-mono bg-muted px-1 rounded text-xs">/{slug}</code></p>
        <p className="text-xs text-muted-foreground">Share the group URL and group password with your members.</p>
      </section>

      <Button
        variant="outline"
        onClick={() => {
          localStorage.removeItem(`bookclub_${slug}_token`);
          setToken(null);
          router.push(`/${slug}`);
        }}
      >
        Sign out of this group
      </Button>
    </main>
  );
}
