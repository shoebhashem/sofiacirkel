"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PasswordGateProps {
  slug: string;
  onAuthenticated: (token: string) => void;
  description?: string;
}

export function PasswordGate({ slug, onAuthenticated, description }: PasswordGateProps) {
  const [groupPassword, setGroupPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/groups/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Incorrect group password.");
        return;
      }

      localStorage.setItem(`bookclub_${slug}_token`, data.token);
      onAuthenticated(data.token);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="group-password">Group password</Label>
        <Input
          id="group-password"
          type="password"
          placeholder="Enter group password"
          value={groupPassword}
          onChange={(e) => setGroupPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Verifying…" : "Unlock"}
      </Button>
    </form>
  );
}
