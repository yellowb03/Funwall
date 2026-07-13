/**
 * Bright classroom wheel segment colors.
 * Prefer CSS variables from theme tokens when available; fall back to fixed palette.
 */

export const WHEEL_SEGMENT_FALLBACK_COLORS = [
  "#0DA9FF", // primary blue
  "#FF4B63", // coral
  "#0F9F6E", // success green
  "#F5A623", // warm amber
  "#7B61FF", // purple
  "#00B8A9", // teal
  "#FF8A5B", // peach
  "#3D5AFE", // indigo
  "#E91E8C", // magenta
  "#26A69A", // soft teal
  "#FFC107", // gold
  "#5C6BC0", // slate blue
] as const;

/**
 * Resolve a segment fill from theme tokens or fallback palette.
 * themeTokens may include `wheel.segment.0` … or `wheelPalette` CSV.
 */
export function segmentColor(
  index: number,
  themeTokens: Record<string, string> = {},
): string {
  const key = `wheel.segment.${index % 12}`;
  if (themeTokens[key]) return themeTokens[key]!;

  const paletteKey = themeTokens["wheel.palette"] ?? themeTokens.wheelPalette;
  if (paletteKey) {
    const parts = paletteKey.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[index % parts.length]!;
    }
  }

  return WHEEL_SEGMENT_FALLBACK_COLORS[
    index % WHEEL_SEGMENT_FALLBACK_COLORS.length
  ]!;
}

/** Readable text on segment: white on saturated fills. */
export function segmentLabelColor(_fill: string): string {
  return "#FFFFFF";
}
