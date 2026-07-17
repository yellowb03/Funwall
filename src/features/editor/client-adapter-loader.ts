"use client";

import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";
import type { EditorAdapter } from "@/features/editor/types";

/**
 * Editor adapters are Client Components. Loading and instantiating them from a
 * Server Component produces a Next.js client-reference proxy rather than the
 * real factory. Keep this switch on the client boundary.
 */
export async function loadClientEditorAdapter(
  templateKey: TemplateKey,
): Promise<EditorAdapter<ContentPackV1>> {
  switch (templateKey) {
    case "wheel": {
      const mod = await import("@/features/templates/wheel/editor/adapter");
      return mod.createEditorAdapter() as EditorAdapter<ContentPackV1>;
    }
    case "wordsearch": {
      const mod = await import(
        "@/features/templates/wordsearch/editor/adapter"
      );
      return mod.createEditorAdapter() as EditorAdapter<ContentPackV1>;
    }
    case "image-quiz": {
      const mod = await import(
        "@/features/templates/image-quiz/editor/adapter"
      );
      return mod.createEditorAdapter() as EditorAdapter<ContentPackV1>;
    }
    case "true-false": {
      const mod = await import(
        "@/features/templates/true-false/editor/adapter"
      );
      return mod.createEditorAdapter() as EditorAdapter<ContentPackV1>;
    }
    case "matching-pairs":
    case "gameshow-quiz":
      throw new Error("This template is still being integrated.");
    default: {
      const exhaustive: never = templateKey;
      throw new Error(`Unsupported template: ${String(exhaustive)}`);
    }
  }
}
