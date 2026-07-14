/**
 * Funwall shared motion system — tokens, patterns, reduced-motion helpers.
 */

export {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  WHEEL_SPIN_DURATION_MS,
  cssDuration,
  type MotionDurationKey,
  type MotionEasingKey,
} from "@/design-system/motion/tokens";

export {
  MOTION_PATTERNS,
  MOTION_PATTERN_IDS,
  type MotionPattern,
  type MotionPatternId,
  type MotionTransformHint,
} from "@/design-system/motion/patterns";

export {
  resolveMotionPattern,
  prefersReducedMotion,
} from "@/design-system/motion/reduced-motion";

export {
  createCelebrationBudget,
  type CelebrationBudget,
  type CelebrationBudgetOptions,
} from "@/design-system/motion/celebration-budget";
