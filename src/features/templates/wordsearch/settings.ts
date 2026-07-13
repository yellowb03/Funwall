import { z } from "zod";

/**
 * Wordsearch settings v1.
 * @see FUNWALL_MASTER_PLAN.md §8.4
 * @see agent-work/07-wordsearch/TASK.md
 */

export const wordsearchSelectionModeSchema = z.enum([
  "drag",
  "tapFirst",
  "tapAny",
]);
export type WordsearchSelectionMode = z.infer<
  typeof wordsearchSelectionModeSchema
>;

export const wordsearchLetterCaseSchema = z.enum(["upper", "lower"]);
export type WordsearchLetterCase = z.infer<typeof wordsearchLetterCaseSchema>;

export const wordsearchDiacriticPolicySchema = z.enum(["fold", "retain"]);
export type WordsearchDiacriticPolicy = z.infer<
  typeof wordsearchDiacriticPolicySchema
>;

export const wordsearchSettingsSchema = z.object({
  version: z.literal(1),
  timerMode: z.enum(["none", "countUp", "countDown"]).default("none"),
  timerSeconds: z.number().int().min(0).max(3600).optional(),
  /** null = unlimited lives */
  lives: z.number().int().min(1).max(99).nullable().default(null),
  selectionMode: wordsearchSelectionModeSchema.default("drag"),
  showWordList: z.boolean().default(true),
  allowDiagonal: z.boolean().default(false),
  allowReverse: z.boolean().default(false),
  letterCase: wordsearchLetterCaseSchema.default("upper"),
  showAnswersAtEnd: z.boolean().default(true),
  /**
   * fold: strip combining marks so grid uses A–Z only (v1 Latin alphabet).
   * retain: attempt to keep base letters; still maps to A–Z under domain playable schema.
   * Display words always preserve the owner-authored form.
   */
  diacriticPolicy: wordsearchDiacriticPolicySchema.default("fold"),
});

export type WordsearchSettings = z.infer<typeof wordsearchSettingsSchema>;

/** Pure, deterministic template defaults. */
export function defaultWordsearchSettings(): WordsearchSettings {
  return {
    version: 1,
    timerMode: "none",
    lives: null,
    selectionMode: "drag",
    showWordList: true,
    allowDiagonal: false,
    allowReverse: false,
    letterCase: "upper",
    showAnswersAtEnd: true,
    diacriticPolicy: "fold",
  };
}

/**
 * Migrate provisional / product-fixture settings into WordsearchSettings v1.
 * Accepts narrative fixture keys (`timer`, `reviewAnswers`, `foldDiacritics`).
 */
export function migrateWordsearchSettings(
  fromVersion: number,
  raw: unknown,
): WordsearchSettings {
  const defaults = defaultWordsearchSettings();

  if (raw === null || raw === undefined || typeof raw !== "object") {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  const timerRaw = obj.timerMode ?? obj.timer;
  let timerMode: WordsearchSettings["timerMode"] = defaults.timerMode;
  if (timerRaw === "none" || timerRaw === "countUp" || timerRaw === "countDown") {
    timerMode = timerRaw;
  }

  let timerSeconds: number | undefined;
  if (typeof obj.timerSeconds === "number" && Number.isFinite(obj.timerSeconds)) {
    timerSeconds = Math.max(0, Math.min(3600, Math.floor(obj.timerSeconds)));
  }

  let lives: number | null = defaults.lives;
  if (obj.lives === null) {
    lives = null;
  } else if (typeof obj.lives === "number" && Number.isFinite(obj.lives)) {
    const n = Math.floor(obj.lives);
    lives = n >= 1 && n <= 99 ? n : defaults.lives;
  }

  let selectionMode: WordsearchSelectionMode = defaults.selectionMode;
  const sel = obj.selectionMode;
  if (sel === "drag" || sel === "tapFirst" || sel === "tapAny") {
    selectionMode = sel;
  }

  const showWordList =
    typeof obj.showWordList === "boolean"
      ? obj.showWordList
      : defaults.showWordList;

  const allowDiagonal =
    typeof obj.allowDiagonal === "boolean"
      ? obj.allowDiagonal
      : defaults.allowDiagonal;

  const allowReverse =
    typeof obj.allowReverse === "boolean"
      ? obj.allowReverse
      : defaults.allowReverse;

  let letterCase: WordsearchLetterCase = defaults.letterCase;
  if (obj.letterCase === "upper" || obj.letterCase === "lower") {
    letterCase = obj.letterCase;
  }

  const showAnswersAtEnd =
    typeof obj.showAnswersAtEnd === "boolean"
      ? obj.showAnswersAtEnd
      : typeof obj.reviewAnswers === "boolean"
        ? obj.reviewAnswers
        : defaults.showAnswersAtEnd;

  let diacriticPolicy: WordsearchDiacriticPolicy = defaults.diacriticPolicy;
  if (obj.diacriticPolicy === "fold" || obj.diacriticPolicy === "retain") {
    diacriticPolicy = obj.diacriticPolicy;
  } else if (typeof obj.foldDiacritics === "boolean") {
    diacriticPolicy = obj.foldDiacritics ? "fold" : "retain";
  }

  const migrated = {
    version: 1 as const,
    timerMode,
    ...(timerSeconds !== undefined ? { timerSeconds } : {}),
    lives,
    selectionMode,
    showWordList,
    allowDiagonal,
    allowReverse,
    letterCase,
    showAnswersAtEnd,
    diacriticPolicy,
  };

  void fromVersion;

  const parsed = wordsearchSettingsSchema.safeParse(migrated);
  return parsed.success ? parsed.data : defaults;
}
