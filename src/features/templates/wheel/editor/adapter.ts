"use client";

import { createElement } from "react";
import type { ListContentV1 } from "@/domain/content/list.v1";
import type { EditorAdapter } from "@/features/editor/types";
import { WheelEditor } from "@/features/templates/wheel/editor/WheelEditor";
import { WHEEL_LIMITS } from "@/features/templates/wheel/validation";

/**
 * Wheel editor adapter — field UI only (no title/progress/Done chrome).
 */
export function createEditorAdapter(): EditorAdapter<ListContentV1> {
  return {
    render(context) {
      const limits = {
        minItems: context.limits?.minItems ?? WHEEL_LIMITS.minItems,
        maxItems: context.limits?.maxItems ?? WHEEL_LIMITS.maxItems,
        helperCopy: context.limits?.helperCopy ?? WHEEL_LIMITS.helperCopy,
      };
      return createElement(WheelEditor, { ...context, limits });
    },
  };
}

export async function loadWheelEditorAdapterModule() {
  return {
    createEditorAdapter,
  };
}
