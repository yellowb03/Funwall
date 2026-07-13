import { z } from "zod";

/**
 * Image Quiz settings v1.
 * @see FUNWALL_MASTER_PLAN.md §8.5
 * @see agent-work/08-image-quiz/TASK.md
 */

export const imageQuizLayoutSchema = z.enum(["together", "separate"]);
export type ImageQuizLayout = z.infer<typeof imageQuizLayoutSchema>;

/** Optional explicit logical tile grid; omit/null for aspect-adaptive default. */
export const imageQuizTileGridSchema = z
  .object({
    cols: z.number().int().min(2).max(24),
    rows: z.number().int().min(2).max(24),
  })
  .optional()
  .nullable();

export type ImageQuizTileGrid = z.infer<typeof imageQuizTileGridSchema>;

export const imageQuizSettingsSchema = z.object({
  version: z.literal(1),
  /** Total reveal duration in seconds; default 30. */
  revealDurationSeconds: z.number().int().min(5).max(120).default(30),
  /** Base points awarded for a correct answer. */
  basePoints: z.number().int().min(1).max(1000).default(100),
  /** Finite lives, or null for unlimited. */
  lives: z.number().int().min(1).max(10).nullable().default(null),
  shuffleQuestions: z.boolean().default(false),
  autoProceed: z.boolean().default(true),
  /** Show answer review after completion. */
  showAnswers: z.boolean().default(true),
  layout: imageQuizLayoutSchema.default("separate"),
  /** Advanced: override adaptive tile grid. */
  tileGrid: imageQuizTileGridSchema,
});

export type ImageQuizSettings = z.infer<typeof imageQuizSettingsSchema>;

/** Pure, deterministic template defaults. */
export function defaultImageQuizSettings(): ImageQuizSettings {
  return {
    version: 1,
    revealDurationSeconds: 30,
    basePoints: 100,
    lives: null,
    shuffleQuestions: false,
    autoProceed: true,
    showAnswers: true,
    layout: "separate",
    tileGrid: null,
  };
}

/**
 * Migrate provisional / product-fixture settings into ImageQuizSettings v1.
 * Accepts current v1 objects and narrative fixture aliases (`reviewAnswers`).
 */
export function migrateImageQuizSettings(
  fromVersion: number,
  raw: unknown,
): ImageQuizSettings {
  const defaults = defaultImageQuizSettings();

  if (raw === null || raw === undefined || typeof raw !== "object") {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  let revealDurationSeconds = defaults.revealDurationSeconds;
  if (
    typeof obj.revealDurationSeconds === "number" &&
    Number.isFinite(obj.revealDurationSeconds)
  ) {
    revealDurationSeconds = Math.max(
      5,
      Math.min(120, Math.floor(obj.revealDurationSeconds)),
    );
  }

  let basePoints = defaults.basePoints;
  if (typeof obj.basePoints === "number" && Number.isFinite(obj.basePoints)) {
    basePoints = Math.max(1, Math.min(1000, Math.floor(obj.basePoints)));
  }

  let lives: number | null = defaults.lives;
  if (obj.lives === null) {
    lives = null;
  } else if (typeof obj.lives === "number" && Number.isFinite(obj.lives)) {
    const n = Math.floor(obj.lives);
    lives = n < 1 ? null : Math.min(10, n);
  }

  const shuffleQuestions =
    typeof obj.shuffleQuestions === "boolean"
      ? obj.shuffleQuestions
      : defaults.shuffleQuestions;

  const autoProceed =
    typeof obj.autoProceed === "boolean"
      ? obj.autoProceed
      : defaults.autoProceed;

  // Canonical: showAnswers; product fixtures used reviewAnswers
  let showAnswers = defaults.showAnswers;
  if (typeof obj.showAnswers === "boolean") {
    showAnswers = obj.showAnswers;
  } else if (typeof obj.reviewAnswers === "boolean") {
    showAnswers = obj.reviewAnswers;
  }

  let layout: ImageQuizLayout = defaults.layout;
  if (obj.layout === "together" || obj.layout === "separate") {
    layout = obj.layout;
  }

  let tileGrid: ImageQuizSettings["tileGrid"] = defaults.tileGrid;
  if (obj.tileGrid === null) {
    tileGrid = null;
  } else if (obj.tileGrid && typeof obj.tileGrid === "object") {
    const g = obj.tileGrid as { cols?: unknown; rows?: unknown };
    if (
      typeof g.cols === "number" &&
      typeof g.rows === "number" &&
      Number.isFinite(g.cols) &&
      Number.isFinite(g.rows)
    ) {
      tileGrid = {
        cols: Math.max(2, Math.min(24, Math.floor(g.cols))),
        rows: Math.max(2, Math.min(24, Math.floor(g.rows))),
      };
    }
  }

  const migrated = {
    version: 1 as const,
    revealDurationSeconds,
    basePoints,
    lives,
    shuffleQuestions,
    autoProceed,
    showAnswers,
    layout,
    tileGrid,
  };

  void fromVersion;

  const parsed = imageQuizSettingsSchema.safeParse(migrated);
  return parsed.success ? parsed.data : defaults;
}

/** Reveal duration in milliseconds from applied settings. */
export function revealDurationMs(settings: ImageQuizSettings): number {
  return settings.revealDurationSeconds * 1000;
}
