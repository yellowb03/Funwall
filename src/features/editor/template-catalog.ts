import type { TemplateKey } from "@/domain/template-keys";
import { TEMPLATE_KEYS } from "@/domain/template-keys";
import type { TemplateMetadata } from "@/domain/template-registration";

/**
 * Static catalog for all six launch templates.
 * Used by the picker even when only Wheel is registered in the product registry.
 * Copy aligned with docs/product/copy-deck.md §3.
 */
export interface TemplateCatalogEntry extends TemplateMetadata {
  /** Recommended picker order (0 = first). */
  recommendedOrder: number;
  shortLabel: string;
}

export const TEMPLATE_CATALOG: readonly TemplateCatalogEntry[] = [
  {
    key: "wheel",
    displayName: "Spin the wheel",
    description:
      "Spin to pick a random item from your list—great for names, topics, or prompts.",
    thumbnailKey: "wheel",
    recommendedOrder: 0,
    shortLabel: "Wheel",
  },
  {
    key: "matching-pairs",
    displayName: "Matching pairs",
    description: "Flip tiles to find matching or related pairs.",
    thumbnailKey: "matching-pairs",
    recommendedOrder: 1,
    shortLabel: "Matching pairs",
  },
  {
    key: "gameshow-quiz",
    displayName: "Gameshow quiz",
    description:
      "Timed multiple-choice rounds with lives, lifelines, and bonus energy.",
    thumbnailKey: "gameshow-quiz",
    recommendedOrder: 2,
    shortLabel: "Gameshow",
  },
  {
    key: "wordsearch",
    displayName: "Wordsearch",
    description: "Hide words in a letter grid; players hunt by drag or tap.",
    thumbnailKey: "wordsearch",
    recommendedOrder: 3,
    shortLabel: "Wordsearch",
  },
  {
    key: "image-quiz",
    displayName: "Image quiz",
    description: "Reveal a picture tile by tile, then buzz in to answer.",
    thumbnailKey: "image-quiz",
    recommendedOrder: 4,
    shortLabel: "Image quiz",
  },
  {
    key: "true-false",
    displayName: "True or false",
    description:
      "Decide whether each statement is true or false before time runs out.",
    thumbnailKey: "true-false",
    recommendedOrder: 5,
    shortLabel: "True or false",
  },
] as const;

export type TemplateSortMode = "recommended" | "alphabetical";

export function getCatalogEntry(key: TemplateKey): TemplateCatalogEntry {
  const entry = TEMPLATE_CATALOG.find((item) => item.key === key);
  if (!entry) {
    throw new Error(`Unknown template key: ${key}`);
  }
  return entry;
}

export function listCatalogEntries(
  sort: TemplateSortMode = "recommended",
): TemplateCatalogEntry[] {
  const items = [...TEMPLATE_CATALOG];
  if (sort === "alphabetical") {
    items.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "en", {
        sensitivity: "base",
      }),
    );
  } else {
    items.sort((a, b) => a.recommendedOrder - b.recommendedOrder);
  }
  return items;
}

/**
 * Filter catalog by case-insensitive name/description match.
 */
export function filterTemplates(
  query: string,
  sort: TemplateSortMode = "recommended",
): TemplateCatalogEntry[] {
  const q = query.trim().toLowerCase();
  const base = listCatalogEntries(sort);
  if (!q) return base;
  return base.filter(
    (entry) =>
      entry.displayName.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.shortLabel.toLowerCase().includes(q) ||
      entry.key.toLowerCase().includes(q),
  );
}

/** Assert catalog covers every frozen template key. */
export function assertCatalogComplete(): void {
  for (const key of TEMPLATE_KEYS) {
    getCatalogEntry(key);
  }
}
