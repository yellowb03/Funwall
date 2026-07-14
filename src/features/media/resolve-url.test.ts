import { describe, expect, it, beforeEach } from "vitest";
import {
  placeholderImageDataUrl,
  resolveMediaUrl,
} from "@/features/media/resolve-url";
import {
  getDefaultMediaStore,
  resetDefaultMediaStoreForTests,
} from "@/features/media/media-store";

describe("resolveMediaUrl", () => {
  beforeEach(() => {
    resetDefaultMediaStoreForTests();
  });

  it("returns null for empty ids", () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("")).toBeNull();
  });

  it("prefers media library url when present", () => {
    const asset = getDefaultMediaStore().selectFromProvider({
      provider: "fixture",
      providerAssetId: "fox-1",
      thumbnailUrl: "https://example.com/t.jpg",
      fullUrl: "https://example.com/full.jpg",
      width: 100,
      height: 80,
      title: "Fox",
      alt: "A fox",
      creatorName: null,
      creatorUrl: null,
      sourcePageUrl: null,
      license: "CC0",
      licenseUrl: null,
      attributionText: "Fox",
    });
    expect(resolveMediaUrl(asset.id)).toBe("https://example.com/full.jpg");
  });

  it("falls back to placeholder data url", () => {
    const url = resolveMediaUrl("dddddddd-dddd-4ddd-8ddd-000000000001", {
      label: "Fox",
    });
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(placeholderImageDataUrl("abc", "Test")).toMatch(/^data:image\/svg\+xml/);
  });
});
