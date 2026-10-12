// Circle fallback swatches — shown when a circle has no book covers yet.
// Each is a soft pastel that reads in both light and dark mode.
const CIRCLE_SWATCHES = [
  { bg: "#F2D4DE", fg: "#8B3A52" }, // blush rose
  { bg: "#D4EAD8", fg: "#3A6B4A" }, // sage
  { bg: "#F5E8C8", fg: "#7A5A20" }, // warm gold
  { bg: "#D8E4F5", fg: "#3A4E8B" }, // periwinkle
  { bg: "#E8D4F0", fg: "#6A3A8B" }, // lavender
  { bg: "#FADED4", fg: "#8B4A3A" }, // terracotta
  { bg: "#D4F0E8", fg: "#2A6B5A" }, // teal
  { bg: "#F0EAD4", fg: "#6B5A30" }, // sand
] as const;

/** Deterministically picks a circle swatch from the circle name. */
export function circleSwatch(name: string) {
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(name.length - 1) ?? 0);
  return CIRCLE_SWATCHES[code % CIRCLE_SWATCHES.length];
}
