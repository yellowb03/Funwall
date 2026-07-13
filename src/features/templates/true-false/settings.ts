import { z } from "zod";

/**
 * True/False settings v1.
 * @see FUNWALL_MASTER_PLAN.md §8.6
 * @see agent-work/09-true-false/TASK.md
 */

export const TRUE_FALSE_SPEED_MIN = 1;
export const TRUE_FALSE_SPEED_MAX = 10;
export const TRUE_FALSE_SPEED_DEFAULT = 5;
export const TRUE_FALSE_LIVES_MIN = 1;
export const TRUE_FALSE_LIVES_MAX = 5;

/**
 * Answer-window duration from speed (bounded linear).
 *
 * Speed 1 = slowest (longest window); speed 10 = fastest (shortest).
 *
 * Formula:
 *   ms = clamp(round(BASE_MS + (MID_SPEED - speed) * STEP_MS), MIN_MS, MAX_MS)
 * where:
 *   BASE_MS = 3500, MID_SPEED = 5, STEP_MS = 450, MIN_MS = 1200, MAX_MS = 8000
 *
 * Speed → window (ms):
 *   1→5300  2→4850  3→4400  4→3950  5→3500
 *   6→3050  7→2600  8→2150  9→1700  10→1250→1200 (clamped)
 *
 * CSS animation duration is presentation only — this value is the
 * monotonic-clock source of truth for answer/expiry resolution.
 */
export const ANSWER_WINDOW_BASE_MS = 3500;
export const ANSWER_WINDOW_STEP_MS = 450;
export const ANSWER_WINDOW_MIN_MS = 1200;
export const ANSWER_WINDOW_MAX_MS = 8000;

export function answerWindowMs(speed: number): number {
  const s = Math.min(
    TRUE_FALSE_SPEED_MAX,
    Math.max(TRUE_FALSE_SPEED_MIN, Math.round(speed)),
  );
  const raw =
    ANSWER_WINDOW_BASE_MS +
    (TRUE_FALSE_SPEED_DEFAULT - s) * ANSWER_WINDOW_STEP_MS;
  return Math.min(
    ANSWER_WINDOW_MAX_MS,
    Math.max(ANSWER_WINDOW_MIN_MS, Math.round(raw)),
  );
}

/** Full speed → window table for tests and docs. */
export function answerWindowTable(): Record<number, number> {
  const table: Record<number, number> = {};
  for (let s = TRUE_FALSE_SPEED_MIN; s <= TRUE_FALSE_SPEED_MAX; s += 1) {
    table[s] = answerWindowMs(s);
  }
  return table;
}

export const trueFalseSettingsSchema = z.object({
  version: z.literal(1),
  timerMode: z.enum(["none", "countUp", "countDown"]).default("none"),
  timerSeconds: z.number().int().min(0).max(3600).optional(),
  speed: z
    .number()
    .int()
    .min(TRUE_FALSE_SPEED_MIN)
    .max(TRUE_FALSE_SPEED_MAX)
    .default(TRUE_FALSE_SPEED_DEFAULT),
  /** null = unlimited lives. */
  lives: z
    .number()
    .int()
    .min(TRUE_FALSE_LIVES_MIN)
    .max(TRUE_FALSE_LIVES_MAX)
    .nullable()
    .default(null),
  /** Only meaningful with countDown; ignored otherwise. */
  repeatUntilTime: z.boolean().default(false),
  showAnswers: z.boolean().default(true),
  /** When true, order is seeded-shuffled via contentOrder stream. */
  shuffle: z.boolean().default(false),
});

export type TrueFalseSettings = z.infer<typeof trueFalseSettingsSchema>;

/** Pure, deterministic template defaults. */
export function defaultTrueFalseSettings(): TrueFalseSettings {
  return {
    version: 1,
    timerMode: "none",
    speed: TRUE_FALSE_SPEED_DEFAULT,
    lives: null,
    repeatUntilTime: false,
    showAnswers: true,
    shuffle: false,
  };
}

/**
 * Migrate provisional / product-fixture settings shapes into TrueFalseSettings v1.
 * Accepts current v1 objects and narrative fixture keys (`timer`, `reviewAnswers`).
 */
export function migrateTrueFalseSettings(
  fromVersion: number,
  raw: unknown,
): TrueFalseSettings {
  const defaults = defaultTrueFalseSettings();

  if (raw === null || raw === undefined || typeof raw !== "object") {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  const timerRaw = obj.timerMode ?? obj.timer;
  let timerMode: TrueFalseSettings["timerMode"] = defaults.timerMode;
  if (
    timerRaw === "none" ||
    timerRaw === "countUp" ||
    timerRaw === "countDown"
  ) {
    timerMode = timerRaw;
  }

  let timerSeconds: number | undefined;
  if (typeof obj.timerSeconds === "number" && Number.isFinite(obj.timerSeconds)) {
    timerSeconds = Math.max(0, Math.min(3600, Math.floor(obj.timerSeconds)));
  }

  let speed = defaults.speed;
  if (typeof obj.speed === "number" && Number.isFinite(obj.speed)) {
    speed = Math.min(
      TRUE_FALSE_SPEED_MAX,
      Math.max(TRUE_FALSE_SPEED_MIN, Math.round(obj.speed)),
    );
  }

  let lives: number | null = defaults.lives;
  if (obj.lives === null || obj.lives === "unlimited" || obj.lives === 0) {
    lives = null;
  } else if (typeof obj.lives === "number" && Number.isFinite(obj.lives)) {
    const n = Math.floor(obj.lives);
    if (n >= TRUE_FALSE_LIVES_MIN && n <= TRUE_FALSE_LIVES_MAX) {
      lives = n;
    } else if (n <= 0) {
      lives = null;
    } else {
      lives = TRUE_FALSE_LIVES_MAX;
    }
  }

  const repeatUntilTime =
    typeof obj.repeatUntilTime === "boolean"
      ? obj.repeatUntilTime
      : defaults.repeatUntilTime;

  const showAnswers =
    typeof obj.showAnswers === "boolean"
      ? obj.showAnswers
      : typeof obj.reviewAnswers === "boolean"
        ? obj.reviewAnswers
        : defaults.showAnswers;

  const shuffle =
    typeof obj.shuffle === "boolean"
      ? obj.shuffle
      : typeof obj.shuffleStatements === "boolean"
        ? obj.shuffleStatements
        : defaults.shuffle;

  const migrated = {
    version: 1 as const,
    timerMode,
    ...(timerSeconds !== undefined ? { timerSeconds } : {}),
    speed,
    lives,
    repeatUntilTime,
    showAnswers,
    shuffle,
  };

  void fromVersion;

  const parsed = trueFalseSettingsSchema.safeParse(migrated);
  return parsed.success ? parsed.data : defaults;
}
