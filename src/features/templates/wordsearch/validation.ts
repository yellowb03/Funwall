import {
  wordsearchContentV1PlayableSchema,
  wordsearchContentV1Schema,
  type WordsearchContentV1,
} from "@/domain/content/wordsearch.v1";
import type { ValidationIssue } from "@/features/editor/types";
import { WORDSEARCH_COPY } from "@/features/templates/wordsearch/copy";
import {
  normalizeWord,
  resolveNormalizedWord,
} from "@/features/templates/wordsearch/normalize";
import { WORDSEARCH_MAX_GRID } from "@/features/templates/wordsearch/generator";
import type { WordsearchDiacriticPolicy } from "@/features/templates/wordsearch/settings";

export const WORDSEARCH_MIN_WORDS = 2;
export const WORDSEARCH_MAX_WORDS = 40;
export const WORDSEARCH_WARN_WORD_COUNT = 16;
export const WORDSEARCH_RECOMMENDED_MIN = 6;

export const WORDSEARCH_LIMITS = {
  minItems: WORDSEARCH_MIN_WORDS,
  maxItems: WORDSEARCH_MAX_WORDS,
  helperCopy: WORDSEARCH_COPY.limits,
} as const;

export interface WordsearchValidationOptions {
  diacriticPolicy?: WordsearchDiacriticPolicy;
}

/**
 * Draft validation: incomplete OK, but surface useful issues for the editor.
 */
export function validateWordsearchDraft(
  draft: unknown,
  options: WordsearchValidationOptions = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const diacriticPolicy = options.diacriticPolicy ?? "fold";
  const parsed = wordsearchContentV1Schema.safeParse(draft);

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

  if (pack.words.length > WORDSEARCH_MAX_WORDS) {
    issues.push({
      path: ["words"],
      message: `At most ${WORDSEARCH_MAX_WORDS} words are allowed.`,
      severity: "error",
    });
  }

  if (pack.words.length > WORDSEARCH_WARN_WORD_COUNT) {
    issues.push({
      path: ["words"],
      message: WORDSEARCH_COPY.warnMany,
      severity: "warning",
    });
  }

  const seen = new Map<string, number>();
  let validNormalizedCount = 0;

  pack.words.forEach((word, index) => {
    const display = word.displayWord ?? "";
    if (!display.trim()) {
      issues.push({
        path: ["words", index, "displayWord"],
        message: WORDSEARCH_COPY.valEmpty,
        severity: "warning",
      });
      return;
    }

    const result = resolveNormalizedWord(display, word.normalizedWord, {
      diacriticPolicy,
      maxLength: WORDSEARCH_MAX_GRID,
    });

    if (!result.ok) {
      const message =
        result.error === "unsupported_charset"
          ? WORDSEARCH_COPY.valCharset(display)
          : result.error === "too_long"
            ? WORDSEARCH_COPY.valTooLong(display)
            : result.error === "too_short"
              ? WORDSEARCH_COPY.valShort(display)
              : WORDSEARCH_COPY.valEmpty;
      issues.push({
        path: ["words", index, "displayWord"],
        message,
        severity: "error",
      });
      return;
    }

    validNormalizedCount += 1;
    const prior = seen.get(result.normalizedWord);
    if (prior !== undefined) {
      issues.push({
        path: ["words", index, "normalizedWord"],
        message: WORDSEARCH_COPY.valDuplicate(display),
        severity: "error",
      });
    } else {
      seen.set(result.normalizedWord, index);
    }

    // Surface mismatch if stored normalized differs from computed
    if (
      word.normalizedWord &&
      word.normalizedWord.trim().toUpperCase() !== result.normalizedWord
    ) {
      issues.push({
        path: ["words", index, "normalizedWord"],
        message: `Grid letters will be “${result.normalizedWord}” (from “${display}”).`,
        severity: "warning",
      });
    }
  });

  if (validNormalizedCount < WORDSEARCH_MIN_WORDS) {
    issues.push({
      path: ["words"],
      message: WORDSEARCH_COPY.valMin,
      severity: "error",
    });
  }

  return issues;
}

/**
 * Playable gate for Done / public play.
 */
export function validateWordsearchPlayable(draft: unknown): {
  ok: boolean;
  data?: WordsearchContentV1;
  issues: ValidationIssue[];
} {
  const result = wordsearchContentV1PlayableSchema.safeParse(draft);
  if (result.success) {
    // Extra check: recompute normalization uniqueness under fold policy
    const seen = new Set<string>();
    const issues: ValidationIssue[] = [];
    for (let i = 0; i < result.data.words.length; i += 1) {
      const w = result.data.words[i]!;
      const n = normalizeWord(w.displayWord || w.normalizedWord, {
        diacriticPolicy: "fold",
      });
      const token = n.ok ? n.normalizedWord : w.normalizedWord.trim().toUpperCase();
      if (seen.has(token)) {
        issues.push({
          path: ["words", i, "normalizedWord"],
          message: WORDSEARCH_COPY.valDuplicate(w.displayWord),
          severity: "error",
        });
      }
      seen.add(token);
    }
    if (issues.length > 0) {
      return { ok: false, issues };
    }
    return { ok: true, data: result.data, issues: [] };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path as Array<string | number>,
    message:
      issue.message === "Playable wordsearch requires at least 2 words"
        ? WORDSEARCH_COPY.valMin
        : issue.message,
    severity: "error" as const,
  }));

  return { ok: false, issues };
}

export function isWordsearchPlayable(draft: unknown): boolean {
  return wordsearchContentV1PlayableSchema.safeParse(draft).success;
}
