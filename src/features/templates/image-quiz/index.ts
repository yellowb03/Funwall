/**
 * Image Quiz template public surface.
 *
 * Safe for server imports: registration, settings, validation, reveal, scoring, session.
 * Client UI adapters live under `./editor/*`, `./player/*`, `./review/*` and load
 * via `createImageQuizRegistration().loadEditorAdapter / loadPlayerAdapter / loadResultReviewAdapter`.
 *
 * Integration lead: register with `createImageQuizRegistration()` in registry.ts.
 */
export {
  createImageQuizRegistration,
  defaultImageQuizSettings,
  migrateImageQuizSettings,
  imageQuizSettingsSchema,
  revealDurationMs,
  type ImageQuizSettings,
  type ImageQuizLayout,
} from "@/features/templates/image-quiz/registration";

export {
  validateImageQuizDraft,
  validateImageQuizPlayable,
  isImageQuizPlayable,
  IMAGE_QUIZ_LIMITS,
  IMAGE_QUIZ_MIN_QUESTIONS,
  IMAGE_QUIZ_MAX_QUESTIONS,
  IMAGE_QUIZ_MIN_ANSWERS,
  IMAGE_QUIZ_MAX_ANSWERS,
} from "@/features/templates/image-quiz/validation";

export {
  computeTileGrid,
  buildRevealOrder,
  revealedCountAt,
  hiddenTileFraction,
  batchRevealCount,
  DEFAULT_LANDSCAPE_COLS,
  DEFAULT_LANDSCAPE_ROWS,
  type TileGridSize,
} from "@/features/templates/image-quiz/reveal";

export {
  scoreImageQuizAnswer,
  sumQuestionPoints,
  IMAGE_QUIZ_SCORING_VERSION,
  MAX_REVEAL_BONUS,
  MAX_ANSWER_SPEED_BONUS,
} from "@/features/templates/image-quiz/scoring";

export {
  createImageQuizSession,
  applyBuzz,
  tickReveal,
  submitAnswer,
  canBuzz,
  canAnswer,
  buildImageQuizResultDetail,
  type ImageQuizSessionState,
  type ImageQuizPhase,
  type QuestionResultDetail,
} from "@/features/templates/image-quiz/session";

export { imageQuizFixtures } from "@/features/templates/image-quiz/fixtures";
export { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";

export const TEMPLATE_KEY = "image-quiz" as const;
