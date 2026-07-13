import type { MediaSearchResult } from "@/features/media/types";

/**
 * Normalize Openverse (or similar) API hits into provider-neutral results.
 * Safe to call with partial objects; missing fields get conservative defaults.
 */
export function normalizeOpenverseResult(
  raw: Record<string, unknown>,
): MediaSearchResult | null {
  const id = stringOrNull(raw.id) ?? stringOrNull(raw.foreign_landing_url);
  if (!id) return null;

  const thumbnailUrl =
    stringOrNull(raw.thumbnail) ??
    stringOrNull(raw.url) ??
    stringOrNull(raw.foreign_landing_url);
  if (!thumbnailUrl) return null;

  const fullUrl = stringOrNull(raw.url) ?? thumbnailUrl;
  const title = stringOrNull(raw.title) ?? "Untitled image";
  const creator = stringOrNull(raw.creator);
  const license = stringOrNull(raw.license) ?? "Unknown";
  const licenseUrl = stringOrNull(raw.license_url);
  const creatorUrl = stringOrNull(raw.creator_url);
  const sourcePageUrl =
    stringOrNull(raw.foreign_landing_url) ?? stringOrNull(raw.detail_url);

  const width = numberOr(raw.width, 0);
  const height = numberOr(raw.height, 0);

  const attributionText = buildAttribution({
    title,
    creator,
    license,
  });

  return {
    provider: "openverse",
    providerAssetId: id,
    thumbnailUrl,
    fullUrl,
    width,
    height,
    title,
    altCandidate: title,
    creatorName: creator,
    creatorUrl,
    sourcePageUrl,
    license: license.toUpperCase(),
    licenseUrl,
    attributionText,
    selectionToken: stringOrNull(raw.id) ?? undefined,
  };
}

export function buildAttribution(input: {
  title: string;
  creator: string | null;
  license: string;
}): string {
  const who = input.creator?.trim() || "Unknown creator";
  return `${input.title} — ${who} (${input.license})`;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function numberOr(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}
