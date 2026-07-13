import type { ContentFamily } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";

/**
 * Conversion / compatibility stubs for template switching.
 * @see FUNWALL_MASTER_PLAN.md §6.4
 */
export type ConversionSafety = "native" | "safe" | "reviewable" | "blocked";

export interface ConversionDescriptor {
  fromFamily: ContentFamily;
  toTemplate: TemplateKey;
  safety: ConversionSafety;
  /** Human-readable reason when blocked or reviewable. */
  note?: string;
}

export interface ConversionPreview {
  safety: ConversionSafety;
  title: string;
  missingFields: string[];
  discardedFields: string[];
  /** Transformed content pack when conversion is possible. */
  previewContent: unknown | null;
}

export interface CompatibilityDetector {
  canConvert(fromFamily: ContentFamily, toTemplate: TemplateKey): ConversionSafety;
  preview(input: {
    fromFamily: ContentFamily;
    content: unknown;
    toTemplate: TemplateKey;
  }): ConversionPreview;
}

/** Placeholder detector — Wave 1/2 agents fill real conversion logic. */
export function createBlockedCompatibilityDetector(): CompatibilityDetector {
  return {
    canConvert(fromFamily, toTemplate) {
      // Native paths only until conversion work lands.
      const native: Record<TemplateKey, ContentFamily> = {
        wheel: "list",
        "matching-pairs": "pairs",
        "gameshow-quiz": "quiz",
        wordsearch: "wordsearch",
        "image-quiz": "imageQuiz",
        "true-false": "statements",
      };
      return native[toTemplate] === fromFamily ? "native" : "blocked";
    },
    preview({ fromFamily, toTemplate }) {
      const safety = this.canConvert(fromFamily, toTemplate);
      return {
        safety,
        title: `${fromFamily} → ${toTemplate}`,
        missingFields: safety === "blocked" ? ["conversion-not-implemented"] : [],
        discardedFields: [],
        previewContent: null,
      };
    },
  };
}
