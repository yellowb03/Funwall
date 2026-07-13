/**
 * Wheel template public surface.
 *
 * Safe for server imports: registration, settings, validation, geometry, session.
 * Client UI adapters live under `./editor/*` and `./player/*` and are loaded
 * via `createWheelRegistration().loadEditorAdapter / loadPlayerAdapter`.
 */
export {
  createWheelRegistration,
  defaultWheelSettings,
  migrateWheelSettings,
  wheelSettingsSchema,
  spinDurationMs,
  spinExtraTurns,
  type WheelSettings,
  type WheelSpinPower,
  type WheelImageDisplayPolicy,
} from "@/features/templates/wheel/registration";

export {
  validateWheelDraft,
  validateWheelPlayable,
  isWheelPlayable,
  WHEEL_LIMITS,
  WHEEL_MIN_ITEMS,
  WHEEL_MAX_ITEMS,
  WHEEL_WARN_ITEM_COUNT,
} from "@/features/templates/wheel/validation";

export {
  selectWinnerId,
  createWheelSession,
  eliminateSelected,
  remainingItems,
  restartSession,
  canSpin,
  beginSpin,
  type WheelSessionState,
  type WheelPhase,
} from "@/features/templates/wheel/session";

export {
  targetRotationForWinner,
  segmentIndexAtRotation,
  rotationAgreesWithWinner,
  normalizeDegrees,
  segmentAngleDeg,
} from "@/features/templates/wheel/geometry";

export { wheelFixtures } from "@/features/templates/wheel/fixtures";
export { WHEEL_COPY } from "@/features/templates/wheel/copy";
