"use client";

import type { WordsearchContentV1 } from "@/domain/content/wordsearch.v1";
import type { EditorAdapter } from "@/features/editor/types";
import { WordsearchEditor } from "@/features/templates/wordsearch/editor/WordsearchEditor";
import { WORDSEARCH_LIMITS } from "@/features/templates/wordsearch/validation";

/**
 * Wordsearch editor adapter — field UI only (no title/progress/Done chrome).
 */
export function createEditorAdapter(): EditorAdapter<WordsearchContentV1> {
  return {
    render(context) {
      const limits = {
        minItems: context.limits?.minItems ?? WORDSEARCH_LIMITS.minItems,
        maxItems: context.limits?.maxItems ?? WORDSEARCH_LIMITS.maxItems,
        helperCopy: context.limits?.helperCopy ?? WORDSEARCH_LIMITS.helperCopy,
      };
      return WordsearchEditor({ ...context, limits });
    },
  };
}

export async function loadWordsearchEditorAdapterModule() {
  return {
    createEditorAdapter,
  };
}
