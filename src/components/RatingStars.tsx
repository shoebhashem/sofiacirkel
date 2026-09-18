"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number | null; // current average or user's selection
  interactive?: boolean;
  onRate?: (stars: number) => void;
  size?: "sm" | "md";
}

export function RatingStars({ value, interactive = false, onRate, size = "md" }: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value ?? 0;
  const dotSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div className={cn("flex items-center", gap)}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(null)}
          className={cn(
            "rounded-full transition-colors",
            dotSize,
            star <= display
              ? "bg-amber-400"
              : "bg-muted-foreground/20",
            interactive && "cursor-pointer hover:scale-110 transition-transform"
          )}
          aria-label={`Rate ${star} out of 10`}
        />
      ))}
      {value !== null && (
        <span className={cn("ml-1 tabular-nums text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
