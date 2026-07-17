import { describe, expect, it } from "vitest";
import {
  buildAttribution,
  normalizeOpenverseResult,
} from "@/features/media/normalize";
import { searchFixtureMedia } from "@/features/media/fixtures";

describe("media normalize", () => {
  it("normalizes an Openverse-like hit", () => {
    const result = normalizeOpenverseResult({
      id: "abc123",
      title: "Sunflower",
      url: "https://example.com/full.jpg",
      thumbnail: "https://example.com/thumb.jpg",
      width: 800,
      height: 600,
      creator: "Jane Doe",
      creator_url: "https://example.com/jane",
      foreign_landing_url: "https://example.com/page",
      license: "by",
      license_url: "https://creativecommons.org/licenses/by/4.0/",
    });

    expect(result).not.toBeNull();
    expect(result!.provider).toBe("openverse");
    expect(result!.providerAssetId).toBe("abc123");
    expect(result!.license).toBe("BY");
    expect(result!.attributionText).toContain("Jane Doe");
    expect(result!.thumbnailUrl).toBe("https://example.com/thumb.jpg");
  });

  it("returns null when essential fields are missing", () => {
    expect(normalizeOpenverseResult({})).toBeNull();
    expect(normalizeOpenverseResult({ id: "x" })).toBeNull();
  });

  it("builds attribution text", () => {
    expect(
      buildAttribution({
        title: "Map",
        creator: "Alex",
        license: "CC0",
      }),
    ).toBe("Map — Alex (CC0)");
  });

  it("fixture search filters by query", () => {
    const all = searchFixtureMedia("");
    expect(all.results.length).toBeGreaterThan(0);
    expect(all.unmatched).toBe(false);
    const apples = searchFixtureMedia("apple");
    expect(apples.results.every((r) => r.title.toLowerCase().includes("apple"))).toBe(
      true,
    );
  });

  it("fixture search falls back to full sample set when nothing matches", () => {
    const miss = searchFixtureMedia("zzzz-no-such-image");
    expect(miss.unmatched).toBe(true);
    expect(miss.results.length).toBeGreaterThan(0);
  });
});
