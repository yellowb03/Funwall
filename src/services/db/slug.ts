import { randomBytes } from "node:crypto";

/**
 * Generate a URL-safe public slug with at least 128 bits of randomness.
 * 16 bytes → base64url ≈ 22 characters (128 bits).
 */
export const PUBLIC_SLUG_BYTE_LENGTH = 16;
export const PUBLIC_SLUG_MIN_BITS = 128;

export function generatePublicSlug(byteLength = PUBLIC_SLUG_BYTE_LENGTH): string {
  if (byteLength * 8 < PUBLIC_SLUG_MIN_BITS) {
    throw new Error(
      `Public slug must provide at least ${PUBLIC_SLUG_MIN_BITS} bits of randomness`,
    );
  }
  return randomBytes(byteLength).toString("base64url");
}

/** Estimate entropy bits for a base64url slug of known alphabet size 64. */
export function estimateSlugEntropyBits(slug: string): number {
  // Each base64url char carries 6 bits when alphabet is full.
  return slug.length * 6;
}

export function isSlugEntropySufficient(slug: string): boolean {
  return estimateSlugEntropyBits(slug) >= PUBLIC_SLUG_MIN_BITS;
}
