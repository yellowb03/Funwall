/**
 * Reduced-motion resolution for shared motion patterns.
 *
 * Under reduced motion, spatial transforms collapse to opacity-only fades
 * and duration is clamped to the reduced token (≤150 ms).
 *
 * @see FUNWALL_MASTER_PLAN.md §10.3
 */

import type {
  MotionPattern,
  MotionTransformHint,
} from "@/design-system/motion/patterns";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/design-system/motion/tokens";

/**
 * Keep only opacity on a transform hint (drop scale / y).
 * Returns undefined when the hint has no opacity channel.
 */
function opacityOnly(
  hint: MotionTransformHint | undefined,
): MotionTransformHint | undefined {
  if (hint === undefined) return undefined;
  if (hint.opacity === undefined) return undefined;
  return { opacity: hint.opacity };
}

/**
 * Resolve a pattern for the current motion preference.
 *
 * When `reducedMotion` is true:
 * - `durationMs` is clamped to `MOTION_DURATIONS.reduced` (150)
 * - spatial scale/y are removed; opacity fades remain
 * - easing settles to ease-out (no springy overshoot)
 * - `spatial` is set to false on the returned copy
 */
export function resolveMotionPattern(
  pattern: MotionPattern,
  reducedMotion: boolean,
): MotionPattern {
  if (!reducedMotion) {
    return pattern;
  }

  const durationMs = Math.min(pattern.durationMs, MOTION_DURATIONS.reduced);

  if (!pattern.spatial) {
    return {
      ...pattern,
      durationMs,
      easing: MOTION_EASINGS.easeOut,
    };
  }

  return {
    id: pattern.id,
    durationMs,
    easing: MOTION_EASINGS.easeOut,
    enter: opacityOnly(pattern.enter),
    exit: opacityOnly(pattern.exit),
    spatial: false,
  };
}

/**
 * Read `prefers-reduced-motion: reduce`. Safe for SSR — returns `false`
 * when `window` / `matchMedia` is unavailable.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
