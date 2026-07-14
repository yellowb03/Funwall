/**
 * Shared motion duration and easing tokens.
 *
 * @see docs/references/design-tokens.md §9
 * @see FUNWALL_MASTER_PLAN.md §10.3
 */

/** Duration tokens in milliseconds. */
export const MOTION_DURATIONS = {
  /** Press feedback */
  instant: 80,
  /** Hover color, small toggles */
  fast: 120,
  /** Panel/row transitions */
  ui: 180,
  /** Correct/incorrect feedback window */
  feedback: 350,
  /** Card flip total */
  flip: 420,
  /** Route-level soft transitions */
  page: 250,
  /** Max duration for spatial motion under reduced-motion */
  reduced: 150,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATIONS;

/**
 * Wheel spin duration is settings-driven (4–7 s), not a fixed token.
 * Use this range when validating or documenting spin length.
 */
export const WHEEL_SPIN_DURATION_MS = {
  min: 4000,
  max: 7000,
} as const;

/** CSS easing strings. */
export const MOTION_EASINGS = {
  /** Enter / settle */
  easeOut: "ease-out",
  /** Exit */
  easeIn: "ease-in",
  /** Shared UI motion */
  shared: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** Celebration only — slight overshoot */
  springy: "cubic-bezier(0.34, 1.4, 0.64, 1)",
} as const;

export type MotionEasingKey = keyof typeof MOTION_EASINGS;

/** Format a millisecond value as a CSS time string. */
export function cssDuration(ms: number): `${number}ms` {
  return `${ms}ms`;
}
