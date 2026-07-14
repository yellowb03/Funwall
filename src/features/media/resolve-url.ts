/**
 * Resolve media asset IDs to display URLs for players.
 * Prefers the in-memory library (same tab as editor), then fixture placeholders.
 */

import { getDefaultMediaStore } from "@/features/media/media-store";

/** Deterministic soft placeholder when the asset library has no URL yet. */
export function placeholderImageDataUrl(
  assetId: string,
  label = "Image",
): string {
  const hue =
    [...assetId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const safeLabel = label
    .slice(0, 40)
    .replace(/[<>&'"]/g, "")
    .trim() || "Image";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 70% 72%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 65% 58%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="300" text-anchor="middle" dominant-baseline="middle"
    font-family="system-ui,sans-serif" font-size="36" font-weight="700"
    fill="rgba(17,17,17,0.75)">${escapeXml(safeLabel)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Resolve an owner media asset id for player display.
 * @returns null only when assetId is empty
 */
export function resolveMediaUrl(
  assetId: string | null | undefined,
  options?: { label?: string; allowPlaceholder?: boolean },
): string | null {
  if (!assetId?.trim()) return null;

  try {
    const asset = getDefaultMediaStore().get(assetId);
    if (asset?.url) return asset.url;
  } catch {
    /* SSR / store unavailable */
  }

  if (options?.allowPlaceholder === false) return null;
  return placeholderImageDataUrl(assetId, options?.label ?? "Reveal image");
}
