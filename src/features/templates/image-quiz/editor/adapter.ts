"use client";

import type { ImageQuizContentV1 } from "@/domain/content/imageQuiz.v1";
import type { EditorAdapter } from "@/features/editor/types";
import { ImageQuizEditor } from "@/features/templates/image-quiz/editor/ImageQuizEditor";
import { IMAGE_QUIZ_LIMITS } from "@/features/templates/image-quiz/validation";

/**
 * Image Quiz editor adapter — field UI only (no title/progress/Done chrome).
 */
export function createEditorAdapter(): EditorAdapter<ImageQuizContentV1> {
  return {
    render(context) {
      const limits = {
        minItems: context.limits?.minItems ?? IMAGE_QUIZ_LIMITS.minItems,
        maxItems: context.limits?.maxItems ?? IMAGE_QUIZ_LIMITS.maxItems,
        helperCopy: context.limits?.helperCopy ?? IMAGE_QUIZ_LIMITS.helperCopy,
      };
      return ImageQuizEditor({ ...context, limits });
    },
  };
}

export async function loadImageQuizEditorAdapterModule() {
  return {
    createEditorAdapter,
  };
}
