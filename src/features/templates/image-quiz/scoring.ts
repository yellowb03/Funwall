/**
 * Pure versioned Image Quiz scoring.
 *
 * - Correct: base + hidden-tile fraction bonus + bounded answer-speed bonus
 * - Incorrect / unanswered: 0 (caller handles life loss)
 * - Early buzz alone never earns points
 *
 * @see FUNWALL_MASTER_PLAN.md §8.5
 */

export const IMAGE_QUIZ_SCORING_VERSION = 1;

/** Max points from still-hidden tiles at buzz (inclusive). */
export const MAX_REVEAL_BONUS = 50;

/** Max points from answering quickly after answer phase opens. */
export const MAX_ANSWER_SPEED_BONUS = 25;

/**
 * Answer window used to scale the speed bonus (ms).
 * Answering at t=0 awards full speed bonus; at/after this window awards 0.
 */
export const ANSWER_SPEED_WINDOW_MS = 15_000;

export interface ScoreAnswerInput {
  isCorrect: boolean;
  basePoints: number;
  /** Tiles revealed at buzz (or full count when no buzz / auto open). */
  tilesRevealed: number;
  tileCount: number;
  /** Ms from answer-phase open to answer submit. */
  answerElapsedMs: number;
  /** Optional override for speed window. */
  answerSpeedWindowMs?: number;
  maxRevealBonus?: number;
  maxSpeedBonus?: number;
}

export interface ScoreAnswerResult {
  version: number;
  points: number;
  baseAwarded: number;
  revealBonus: number;
  speedBonus: number;
  hiddenFraction: number;
}

/**
 * Score a single question resolution.
 * Incorrect/unanswered always yields 0 points.
 */
export function scoreImageQuizAnswer(input: ScoreAnswerInput): ScoreAnswerResult {
  const version = IMAGE_QUIZ_SCORING_VERSION;
  const tileCount = Math.max(0, input.tileCount);
  const revealed = Math.max(0, Math.min(tileCount, input.tilesRevealed));
  const hiddenFraction =
    tileCount > 0 ? (tileCount - revealed) / tileCount : 0;

  if (!input.isCorrect) {
    return {
      version,
      points: 0,
      baseAwarded: 0,
      revealBonus: 0,
      speedBonus: 0,
      hiddenFraction,
    };
  }

  const maxReveal = input.maxRevealBonus ?? MAX_REVEAL_BONUS;
  const maxSpeed = input.maxSpeedBonus ?? MAX_ANSWER_SPEED_BONUS;
  const windowMs = input.answerSpeedWindowMs ?? ANSWER_SPEED_WINDOW_MS;

  const baseAwarded = Math.max(0, Math.floor(input.basePoints));
  const revealBonus = Math.floor(maxReveal * hiddenFraction);

  const answerMs = Math.max(0, input.answerElapsedMs);
  const speedRatio =
    windowMs <= 0 ? 0 : Math.max(0, 1 - Math.min(1, answerMs / windowMs));
  const speedBonus = Math.floor(maxSpeed * speedRatio);

  return {
    version,
    points: baseAwarded + revealBonus + speedBonus,
    baseAwarded,
    revealBonus,
    speedBonus,
    hiddenFraction,
  };
}

/**
 * Reconstruct total score from ordered per-question score results (replay).
 */
export function sumQuestionPoints(
  results: readonly { points: number }[],
): number {
  return results.reduce((sum, r) => sum + Math.max(0, r.points), 0);
}
