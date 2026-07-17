"use client";

import { createElement } from "react";
import type { StatementsContentV1 } from "@/domain/content/statements.v1";
import type { EditorAdapter } from "@/features/editor/types";
import { TrueFalseEditor } from "@/features/templates/true-false/editor/TrueFalseEditor";
import { TRUE_FALSE_LIMITS } from "@/features/templates/true-false/validation";

/**
 * True/False editor adapter — field UI only (no title/progress/Done chrome).
 */
export function createEditorAdapter(): EditorAdapter<StatementsContentV1> {
  return {
    render(context) {
      const limits = {
        minItems: context.limits?.minItems ?? TRUE_FALSE_LIMITS.minItems,
        maxItems: context.limits?.maxItems ?? TRUE_FALSE_LIMITS.maxItems,
        helperCopy: context.limits?.helperCopy ?? TRUE_FALSE_LIMITS.helperCopy,
      };
      return createElement(TrueFalseEditor, { ...context, limits });
    },
  };
}

export async function loadTrueFalseEditorAdapterModule() {
  return {
    createEditorAdapter,
  };
}
