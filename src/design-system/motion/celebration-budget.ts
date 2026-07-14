/**
 * Particle / celebration budget so completion effects cannot thrash the main thread.
 * Motion must never delay input readiness (no locks here — callers gate themselves).
 */

export interface CelebrationBudgetOptions {
  /** Max concurrent celebration instances. Default 2. */
  maxConcurrent?: number;
  /** Min ms between celebration starts. Default 400. */
  minIntervalMs?: number;
  /** Optional clock for tests. */
  now?: () => number;
}

export interface CelebrationBudget {
  /** Returns true if a new celebration may start; reserves a slot. */
  tryAcquire(): boolean;
  /** Release a slot when animation/cleanup finishes. */
  release(): void;
  /** Force clear all slots (route change / restart). */
  reset(): void;
  activeCount(): number;
}

export function createCelebrationBudget(
  options: CelebrationBudgetOptions = {},
): CelebrationBudget {
  const maxConcurrent = options.maxConcurrent ?? 2;
  const minIntervalMs = options.minIntervalMs ?? 400;
  const now = options.now ?? (() => performance.now());

  let active = 0;
  let lastStart = -Infinity;

  return {
    tryAcquire() {
      const t = now();
      if (active >= maxConcurrent) return false;
      if (t - lastStart < minIntervalMs) return false;
      active += 1;
      lastStart = t;
      return true;
    },
    release() {
      active = Math.max(0, active - 1);
    },
    reset() {
      active = 0;
      lastStart = -Infinity;
    },
    activeCount() {
      return active;
    },
  };
}
