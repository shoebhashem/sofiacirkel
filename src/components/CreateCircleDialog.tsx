"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function CreateCircleDialog({ open, onOpenChange, locale }: Props) {
  const t = useTranslations("circle");
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = toSlug(name);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t("nameRequired")); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      const { circle } = await res.json();
      onOpenChange(false);
      router.push(`/${locale}/${circle.slug}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{t("createTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          <div className="flex flex-col gap-1.5">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={t("namePlaceholder")}
              className="border border-border bg-card rounded-md px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              maxLength={60}
              disabled={loading}
            />
            {slug && (
              <p className="text-xs text-muted-foreground px-0.5">
                {t("slugLabel")}: <span className="font-mono text-foreground/70">sofiacirkel.com/{slug}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("creating") : t("create")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
