"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookCard } from "@/components/BookCard";
import { BookSearch } from "@/components/BookSearch";
import { PasswordGate } from "@/components/PasswordGate";
import type { Group, GroupBook, GoogleBooksResult } from "@/types";

export default function GroupPage() {
  const { slug } = useParams<{ slug: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [books, setBooks] = useState<GroupBook[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addToList, setAddToList] = useState<"want_to_read" | "already_read">("want_to_read");
  const [addError, setAddError] = useState<string | null>(null);
  const [showPasswordGate, setShowPasswordGate] = useState(false);

  const readBooks = books.filter((b) => b.status === "already_read");
  const wantBooks = books.filter((b) => b.status === "want_to_read");

  const fetchBooks = useCallback(async () => {
    const res = await fetch(`/api/groups/${slug}/books`);
    if (res.ok) {
      const data = await res.json();
      setBooks(data.books);
    }
  }, [slug]);

  useEffect(() => {
    async function init() {
      // Load stored token
      const stored = localStorage.getItem(`bookclub_${slug}_token`);
      if (stored) setToken(stored);

      // Fetch group info
      const res = await fetch(`/api/groups/${slug}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setGroup(data.group);

      await fetchBooks();
      setLoading(false);
    }
    init();
  }, [slug, fetchBooks]);

  async function handleAddBook(googleBook: GoogleBooksResult) {
    if (!token) { setShowPasswordGate(true); return; }
    setAddError(null);

    const res = await fetch(`/api/groups/${slug}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ googleBook, status: addToList }),
    });
    const data = await res.json();

    if (!res.ok) {
      setAddError(data.error ?? "Failed to add book.");
      return;
    }

    setBooks((prev) => [data.groupBook, ...prev]);
    setAddOpen(false);
  }

  async function handleMarkRead(gbId: string) {
    if (!token) { setShowPasswordGate(true); return; }

    const res = await fetch(`/api/groups/${slug}/books/${gbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "already_read" }),
    });
    if (res.ok) await fetchBooks();
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Group not found</h1>
        <p className="text-muted-foreground">No group called <code className="font-mono bg-muted px-1 rounded">{slug}</code> exists.</p>
        <Link href="/"><Button variant="secondary">Back to home</Button></Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">← Bokklubben</Link>
          <h1 className="font-serif text-2xl font-bold mt-1">{group?.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">/{slug}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {token ? (
            <Link href={`/${slug}/settings`}>
              <Button variant="outline" size="sm">Settings</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordGate(true)}>
              Admin
            </Button>
          )}
        </div>
      </header>

      {/* Password gate (inline, shown on demand) */}
      {showPasswordGate && !token && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="text-sm font-medium mb-3">Enter the group password to make changes</p>
          <PasswordGate
            slug={slug}
            onAuthenticated={(t) => { setToken(t); setShowPasswordGate(false); }}
          />
        </div>
      )}

      {/* Add book button */}
      {token && (
        <>
          <Button className="w-full sm:w-auto" onClick={() => setAddOpen(true)}>+ Add book</Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add a book</DialogTitle>
            </DialogHeader>

            <div className="flex gap-2 mb-3">
              {(["want_to_read", "already_read"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAddToList(s)}
                  className={`flex-1 rounded border py-1.5 text-sm transition-colors ${
                    addToList === s ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted"
                  }`}
                >
                  {s === "want_to_read" ? "Want to read" : "Already read"}
                </button>
              ))}
            </div>

            <BookSearch onSelect={handleAddBook} />
            {addError && <p className="text-sm text-destructive mt-1">{addError}</p>}
          </DialogContent>
        </Dialog>
        </>
      )}

      {/* Book lists */}
      <Tabs defaultValue="read">
        <TabsList className="w-full">
          <TabsTrigger value="read" className="flex-1">
            Already read <span className="ml-1.5 text-muted-foreground text-xs">({readBooks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="want" className="flex-1">
            Want to read <span className="ml-1.5 text-muted-foreground text-xs">({wantBooks.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="mt-4">
          {readBooks.length === 0 ? (
            <EmptyState message="No books read yet." />
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {readBooks.map((gb) => (
                <li key={gb.id}>
                  <BookCard groupBook={gb} slug={slug} showRating />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="want" className="mt-4">
          {wantBooks.length === 0 ? (
            <EmptyState message="No books in the reading queue." />
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {wantBooks.map((gb) => (
                <li key={gb.id} className="flex flex-col gap-1">
                  <BookCard groupBook={gb} slug={slug} showRating={false} />
                  {token && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-fit text-xs"
                      onClick={() => handleMarkRead(gb.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">{message}</div>
  );
}
