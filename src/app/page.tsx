"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const router = useRouter();

  // — Create group form —
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [groupPassword, setGroupPassword] = useState("");
  const [ratingMode, setRatingMode] = useState<"public" | "private">("public");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // — Find group form —
  const [findSlug, setFindSlug] = useState("");

  function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, groupPassword, ratingMode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create group.");
        return;
      }

      // Store the group token so the creator is immediately authenticated
      localStorage.setItem(`bookclub_${slug}_token`, data.token);
      router.push(`/${data.group.slug}`);
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleFind(e: React.FormEvent) {
    e.preventDefault();
    const s = findSlug.trim().toLowerCase();
    if (s) router.push(`/${s}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 gap-12">
      {/* Header */}
      <div className="text-center max-w-md">
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-2">📚 Bokklubben</h1>
        <p className="text-muted-foreground">
          Create a private reading group. Track what you&apos;ve read, what&apos;s next, and how you rated it.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Find existing group */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Find your group</h2>
          <form onSubmit={handleFind} className="flex gap-2">
            <Input
              placeholder="Group name (e.g. readers2026)"
              value={findSlug}
              onChange={(e) => setFindSlug(e.target.value)}
            />
            <Button type="submit" disabled={!findSlug.trim()}>Go</Button>
          </form>
        </section>

        <Separator />

        {/* Create new group */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Create a new group</h2>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Group display name</Label>
              <Input
                id="name"
                placeholder="The Thursday Readers"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">
                Group URL name{" "}
                <span className="text-muted-foreground font-normal text-xs">(lowercase, hyphens only)</span>
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground shrink-0">bokklubben.com/</span>
                <Input
                  id="slug"
                  placeholder="thursday-readers"
                  value={slug}
                  onChange={(e) => {
                    setSlug(toSlug(e.target.value));
                    setSlugEdited(true);
                  }}
                  pattern="[a-z0-9-]{3,40}"
                  title="3–40 lowercase letters, numbers, and hyphens"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-password">
                Group password{" "}
                <span className="text-muted-foreground font-normal text-xs">— shared with all members</span>
              </Label>
              <Input
                id="group-password"
                type="password"
                placeholder="Choose a group password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                minLength={4}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Who can rate books?</Label>
              <div className="flex gap-2">
                {(["public", "private"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRatingMode(mode)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                      ratingMode === mode
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Badge variant={mode === "public" ? "secondary" : "outline"} className="mb-1">
                      {mode === "public" ? "Public" : "Private"}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {mode === "public"
                        ? "Anyone visiting the page"
                        : "Requires the group password"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {createError && <p className="text-sm text-destructive">{createError}</p>}

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? "Creating…" : "Create group"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
