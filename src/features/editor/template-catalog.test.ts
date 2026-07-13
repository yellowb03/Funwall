import { describe, expect, it } from "vitest";
import { TEMPLATE_KEYS } from "@/domain/template-keys";
import {
  filterTemplates,
  listCatalogEntries,
  TEMPLATE_CATALOG,
} from "@/features/editor/template-catalog";

describe("template catalog and filter", () => {
  it("covers all six launch templates", () => {
    expect(TEMPLATE_CATALOG).toHaveLength(6);
    for (const key of TEMPLATE_KEYS) {
      expect(TEMPLATE_CATALOG.some((e) => e.key === key)).toBe(true);
    }
  });

  it("recommended order starts with wheel", () => {
    const list = listCatalogEntries("recommended");
    expect(list.map((e) => e.key)).toEqual([
      "wheel",
      "matching-pairs",
      "gameshow-quiz",
      "wordsearch",
      "image-quiz",
      "true-false",
    ]);
  });

  it("alphabetical sort is by display name", () => {
    const list = listCatalogEntries("alphabetical");
    const names = list.map((e) => e.displayName);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
  });

  it("filters by name and description", () => {
    const byName = filterTemplates("wheel");
    expect(byName.some((e) => e.key === "wheel")).toBe(true);
    expect(byName.every((e) => e.key === "wheel")).toBe(true);

    const byDesc = filterTemplates("letter grid");
    expect(byDesc.map((e) => e.key)).toEqual(["wordsearch"]);

    const none = filterTemplates("zzzz-not-a-template");
    expect(none).toHaveLength(0);
  });

  it("empty query returns all under the chosen sort", () => {
    expect(filterTemplates("", "recommended")).toHaveLength(6);
    expect(filterTemplates("   ", "alphabetical")).toHaveLength(6);
  });
});
