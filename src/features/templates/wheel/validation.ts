import {
  listContentV1PlayableSchema,
  listContentV1Schema,
  type ListContentV1,
} from "@/domain/content/list.v1";
import { hasMeaningfulContent } from "@/domain/rich-content";
import type { ValidationIssue } from "@/features/editor/types";

export const WHEEL_MIN_ITEMS = 2;
export const WHEEL_MAX_ITEMS = 100;
export const WHEEL_WARN_ITEM_COUNT = 30;

export const WHEEL_LIMITS = {
  minItems: WHEEL_MIN_ITEMS,
  maxItems: WHEEL_MAX_ITEMS,
  helperCopy:
    "2–100 items. Labels get hard to read above 30.",
} as const;

/**
 * Draft validation: incomplete OK, but surface useful issues for the editor.
 */
export function validateWheelDraft(draft: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = listContentV1Schema.safeParse(draft);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path as Array<string | number>,
        message: issue.message,
        severity: "error",
      });
    }
    return issues;
  }

  const pack = parsed.data;
  const meaningful = pack.items.filter((item) =>
    hasMeaningfulContent(item.content),
  );

  if (pack.items.length > WHEEL_MAX_ITEMS) {
    issues.push({
      path: ["items"],
      message: `At most ${WHEEL_MAX_ITEMS} items are allowed.`,
      severity: "error",
    });
  }

  if (pack.items.length > WHEEL_WARN_ITEM_COUNT) {
    issues.push({
      path: ["items"],
      message:
        "You have more than 30 items. Consider shortening labels.",
      severity: "warning",
    });
  }

  pack.items.forEach((item, index) => {
    if (!hasMeaningfulContent(item.content)) {
      issues.push({
        path: ["items", index],
        message: "This item needs text or an image.",
        severity: "warning",
      });
    }
  });

  if (meaningful.length < WHEEL_MIN_ITEMS) {
    issues.push({
      path: ["items"],
      message: "Add at least 2 items.",
      severity: "error",
    });
  }

  return issues;
}

/**
 * Playable gate for Done / public play. Uses domain list.v1 playable schema.
 */
export function validateWheelPlayable(draft: unknown): {
  ok: boolean;
  data?: ListContentV1;
  issues: ValidationIssue[];
} {
  const result = listContentV1PlayableSchema.safeParse(draft);
  if (result.success) {
    return { ok: true, data: result.data, issues: [] };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path as Array<string | number>,
    message:
      issue.message === "Playable list requires at least 2 non-empty items"
        ? "Add at least 2 items."
        : issue.message,
    severity: "error" as const,
  }));

  return { ok: false, issues };
}

export function isWheelPlayable(draft: unknown): boolean {
  return listContentV1PlayableSchema.safeParse(draft).success;
}
