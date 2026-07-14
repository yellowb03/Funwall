/**
 * Named motion patterns for shared UI and game chrome.
 * Implementers map enter/exit recipe hints to CSS transforms or a motion library.
 *
 * @see FUNWALL_MASTER_PLAN.md §10.3
 */

import { MOTION_DURATIONS, MOTION_EASINGS } from "@/design-system/motion/tokens";

/** CSS transform/opacity recipe hints for enter or exit. */
export type MotionTransformHint = {
  opacity?: number;
  scale?: number;
  y?: number;
};

/**
 * A named motion recipe. `spatial` flags patterns that must collapse
 * under reduced motion (scale/y removed; opacity-only fades remain).
 */
export type MotionPattern = {
  id: string;
  durationMs: number;
  easing: string;
  /** Starting state for enter transitions (absolute or relative hints). */
  enter?: MotionTransformHint;
  /** Target state for exit transitions. */
  exit?: MotionTransformHint;
  /** When true, involves spatial movement that must collapse under reduced motion. */
  spatial: boolean;
};

export type MotionPatternId =
  | "press"
  | "panel"
  | "feedback"
  | "overlay"
  | "cardFlip"
  | "tileReveal"
  | "result"
  | "celebration";

/**
 * Canonical motion patterns. Durations align with design tokens;
 * enter/exit are implementer hints, not runtime animation drivers.
 */
export const MOTION_PATTERNS: Record<MotionPatternId, MotionPattern> = {
  /** Soft press scale on buttons/tiles (80–120 ms band). */
  press: {
    id: "press",
    durationMs: MOTION_DURATIONS.instant,
    easing: MOTION_EASINGS.easeOut,
    enter: { scale: 0.96 },
    exit: { scale: 1 },
    spatial: true,
  },

  /** Panel/row open-close (160–220 ms band → ui token). */
  panel: {
    id: "panel",
    durationMs: MOTION_DURATIONS.ui,
    easing: MOTION_EASINGS.shared,
    enter: { opacity: 0, y: 8 },
    exit: { opacity: 0, y: -4 },
    spatial: true,
  },

  /** Correct/incorrect feedback hold/transition window. */
  feedback: {
    id: "feedback",
    durationMs: MOTION_DURATIONS.feedback,
    easing: MOTION_EASINGS.easeOut,
    enter: { opacity: 0, scale: 0.98 },
    exit: { opacity: 0 },
    spatial: true,
  },

  /** Modal/scrim and overlay fade. Non-spatial opacity-only. */
  overlay: {
    id: "overlay",
    durationMs: MOTION_DURATIONS.page,
    easing: MOTION_EASINGS.easeOut,
    enter: { opacity: 0 },
    exit: { opacity: 0 },
    spatial: false,
  },

  /** Matching-pairs style card flip total. */
  cardFlip: {
    id: "cardFlip",
    durationMs: MOTION_DURATIONS.flip,
    easing: MOTION_EASINGS.shared,
    enter: { scale: 1, opacity: 1 },
    exit: { scale: 0.92, opacity: 0.85 },
    spatial: true,
  },

  /** Image-quiz tile reveal plink appearance. */
  tileReveal: {
    id: "tileReveal",
    durationMs: MOTION_DURATIONS.fast,
    easing: MOTION_EASINGS.easeOut,
    enter: { opacity: 0, scale: 0.9 },
    exit: { opacity: 0, scale: 1.02 },
    spatial: true,
  },

  /** Result / review panel entry. */
  result: {
    id: "result",
    durationMs: MOTION_DURATIONS.page,
    easing: MOTION_EASINGS.shared,
    enter: { opacity: 0, y: 12 },
    exit: { opacity: 0, y: 8 },
    spatial: true,
  },

  /** Completion celebration pop (springy easing only here). */
  celebration: {
    id: "celebration",
    durationMs: MOTION_DURATIONS.feedback,
    easing: MOTION_EASINGS.springy,
    enter: { opacity: 0, scale: 0.85, y: 16 },
    exit: { opacity: 0, scale: 1.05 },
    spatial: true,
  },
};

export const MOTION_PATTERN_IDS = Object.keys(
  MOTION_PATTERNS,
) as MotionPatternId[];
