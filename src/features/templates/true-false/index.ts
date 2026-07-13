/**
 * True/False template public surface.
 *
 * Safe for server imports: registration, settings, validation, session.
 * Client UI adapters live under `./editor/*` and `./player/*` and are loaded
 * via `createTrueFalseRegistration().loadEditorAdapter / loadPlayerAdapter`.
 *
 * Do not edit the central registry from this folder — integration lead wires
 * `createTrueFalseRegistration()` in Workstream 13.
 */
export {
  createTrueFalseRegistration,
  defaultTrueFalseSettings,
  migrateTrueFalseSettings,
  trueFalseSettingsSchema,
  answerWindowMs,
  answerWindowTable,
  type TrueFalseSettings,
} from "@/features/templates/true-false/registration";

export {
  validateTrueFalseDraft,
  validateTrueFalsePlayable,
  isTrueFalsePlayable,
  computeImbalance,
  TRUE_FALSE_LIMITS,
  TF_MIN_STATEMENTS,
  TF_MAX_STATEMENTS,
} from "@/features/templates/true-false/validation";

export {
  createTrueFalseSession,
  beginAnswerWindow,
  captureAnswer,
  tryResolve,
  advanceAfterItem,
  canStartRepeatPass,
  buildTrueFalseResult,
  type TrueFalseSessionState,
  type TrueFalsePhase,
  type TrueFalseAttempt,
} from "@/features/templates/true-false/session";

export { trueFalseFixtures } from "@/features/templates/true-false/fixtures";
export { TRUE_FALSE_COPY } from "@/features/templates/true-false/copy";
export { parseBulkPaste } from "@/features/templates/true-false/bulk-paste";

export const TEMPLATE_KEY = "true-false" as const;
