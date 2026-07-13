import {
  statementsContentV1PlayableSchema,
  statementsContentV1Schema,
  type StatementsContentV1,
} from "@/domain/content/statements.v1";
import { hasMeaningfulContent } from "@/domain/rich-content";
import type { ValidationIssue } from "@/features/editor/types";
import { TRUE_FALSE_COPY } from "@/features/templates/true-false/copy";

/**
 * Domain schema caps at 100; product narrative says 200.
 * Template validation follows the frozen domain schema.
 */
export const TF_MIN_STATEMENTS = 2;
export const TF_MAX_STATEMENTS = 100;

/** Warn when one truth polarity exceeds this share of complete statements. */
export const TF_IMBALANCE_RATIO = 0.8;
export const TF_IMBALANCE_MIN_COUNT = 4;

export const TRUE_FALSE_LIMITS = {
  minItems: TF_MIN_STATEMENTS,
  maxItems: TF_MAX_STATEMENTS,
  helperCopy: TRUE_FALSE_COPY.limits,
} as const;

export function computeImbalance(
  statements: StatementsContentV1["statements"],
): { dominant: "true" | "false"; ratio: number } | null {
  const complete = statements.filter(
    (s) => hasMeaningfulContent(s.content) && typeof s.isTrue === "boolean",
  );
  if (complete.length < TF_IMBALANCE_MIN_COUNT) return null;

  const trueCount = complete.filter((s) => s.isTrue === true).length;
  const falseCount = complete.length - trueCount;
  const ratioTrue = trueCount / complete.length;
  const ratioFalse = falseCount / complete.length;

  if (ratioTrue >= TF_IMBALANCE_RATIO) {
    return { dominant: "true", ratio: ratioTrue };
  }
  if (ratioFalse >= TF_IMBALANCE_RATIO) {
    return { dominant: "false", ratio: ratioFalse };
  }
  return null;
}

/**
 * Draft validation: incomplete OK, but surface useful issues for the editor.
 * Imbalance is a non-blocking warning.
 */
export function validateTrueFalseDraft(draft: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = statementsContentV1Schema.safeParse(draft);

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

  if (pack.statements.length > TF_MAX_STATEMENTS) {
    issues.push({
      path: ["statements"],
      message: TRUE_FALSE_COPY.valMaxStatements,
      severity: "error",
    });
  }

  pack.statements.forEach((statement, index) => {
    if (!hasMeaningfulContent(statement.content)) {
      issues.push({
        path: ["statements", index],
        message: TRUE_FALSE_COPY.valStatementEmpty,
        severity: "warning",
      });
    }
    if (statement.isTrue === null) {
      issues.push({
        path: ["statements", index, "isTrue"],
        message: TRUE_FALSE_COPY.valTruthRequired,
        severity: "warning",
      });
    }
  });

  const complete = pack.statements.filter(
    (s) => hasMeaningfulContent(s.content) && typeof s.isTrue === "boolean",
  );

  if (complete.length < TF_MIN_STATEMENTS) {
    issues.push({
      path: ["statements"],
      message: TRUE_FALSE_COPY.valMinStatements,
      severity: "error",
    });
  }

  const imbalance = computeImbalance(pack.statements);
  if (imbalance) {
    issues.push({
      path: ["statements"],
      message: TRUE_FALSE_COPY.warnImbalance(imbalance.dominant),
      severity: "warning",
    });
  }

  return issues;
}

/**
 * Playable gate for Done / public play. Uses domain statements.v1 playable schema.
 */
export function validateTrueFalsePlayable(draft: unknown): {
  ok: boolean;
  data?: StatementsContentV1;
  issues: ValidationIssue[];
} {
  const result = statementsContentV1PlayableSchema.safeParse(draft);
  if (result.success) {
    return { ok: true, data: result.data, issues: [] };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => {
    let message = issue.message;
    if (
      issue.message.includes("at least 2") ||
      issue.message.includes("Playable statements")
    ) {
      message = TRUE_FALSE_COPY.valMinStatements;
    } else if (issue.message.includes("isTrue must be explicit")) {
      message = TRUE_FALSE_COPY.valTruthRequired;
    }
    return {
      path: issue.path as Array<string | number>,
      message,
      severity: "error" as const,
    };
  });

  return { ok: false, issues };
}

export function isTrueFalsePlayable(draft: unknown): boolean {
  return statementsContentV1PlayableSchema.safeParse(draft).success;
}
