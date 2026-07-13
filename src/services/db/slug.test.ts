import { describe, expect, it } from "vitest";
import {
  estimateSlugEntropyBits,
  generatePublicSlug,
  isSlugEntropySufficient,
  PUBLIC_SLUG_BYTE_LENGTH,
  PUBLIC_SLUG_MIN_BITS,
} from "@/services/db/slug";

describe("generatePublicSlug", () => {
  it("uses 16 random bytes by default (128 bits)", () => {
    expect(PUBLIC_SLUG_BYTE_LENGTH * 8).toBe(PUBLIC_SLUG_MIN_BITS);
    const samples = new Set(
      Array.from({ length: 20 }, () => generatePublicSlug()),
    );
    expect(samples.size).toBe(20);
    for (const slug of samples) {
      expect(isSlugEntropySufficient(slug)).toBe(true);
      expect(estimateSlugEntropyBits(slug)).toBeGreaterThanOrEqual(128);
    }
  });
});
