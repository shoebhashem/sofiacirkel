"use client";

import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Extra classes for the outermost positioning wrapper */
  wrapClassName?: string;
};

/**
 * A primary button with an animated rainbow glow border.
 * Pass padding/size via className; wrapClassName controls flex alignment on the wrapper.
 */
export function GlowButton({ children, className, wrapClassName, ...props }: Props) {
  return (
    // Outer wrapper: establishes the stacking context for the halo
    <span className={cn("relative inline-flex isolation-isolate", wrapClassName)}>
      {/* Blurred outer halo — lives outside the clip so it bleeds outward */}
      <span className="glow-halo rounded-md" aria-hidden="true" />

      {/* Inner wrapper: clips the ring flush to the border shape */}
      <span className="relative overflow-hidden rounded-md p-[3px] inline-flex z-10">
        {/* Rotating conic gradient that forms the visible border */}
        <span className="glow-ring rounded-md" aria-hidden="true" />

        {/* The actual button face, sitting on top of the ring */}
        <button
          className={cn(
            "relative z-10 rounded-[4px] bg-[#111] text-white",
            "text-sm font-medium hover:opacity-85 transition-opacity",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        >
          {children}
        </button>
      </span>
    </span>
  );
}
