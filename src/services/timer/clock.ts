/**
 * Timer / clock interface for the shared player shell.
 * @see agent-work/shared/CONTRACTS.md §10
 * @see docs/adr/ADR-007-timer-pause-visibility.md
 */

export type TimerMode = "none" | "countUp" | "countDown";

export type TimerStatus = "idle" | "running" | "paused" | "elapsed";

export interface Clock {
  /** Monotonic milliseconds since an arbitrary origin (not wall clock). */
  now(): number;
}

export interface TimerSnapshot {
  mode: TimerMode;
  status: TimerStatus;
  /** Elapsed active play time in ms (excludes paused intervals). */
  elapsedMs: number;
  /** Remaining ms for countDown; null otherwise. */
  remainingMs: number | null;
  durationMs: number | null;
}

export interface TimerController {
  readonly mode: TimerMode;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  getSnapshot(): TimerSnapshot;
  /**
   * Subscribe to tick updates. Prefer whole-second cadence for display.
   * Returns unsubscribe.
   */
  subscribe(listener: (snapshot: TimerSnapshot) => void): () => void;
  /** Idempotent timeout signal for countDown mode. */
  onTimeout(listener: () => void): () => void;
  dispose(): void;
}

/** Performance-based monotonic clock. */
export function createMonotonicClock(): Clock {
  return {
    now() {
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }
      return Date.now();
    },
  };
}

export interface CreateTimerOptions {
  mode: TimerMode;
  /** Required when mode is countDown. */
  durationMs?: number;
  clock?: Clock;
  /** Minimum interval between subscriber notifications (ms). Default 250. */
  tickMs?: number;
}

/**
 * Create a shell-owned timer. Template code must not create unmanaged intervals.
 */
export function createTimer(options: CreateTimerOptions): TimerController {
  const clock = options.clock ?? createMonotonicClock();
  const tickMs = options.tickMs ?? 250;
  const mode = options.mode;
  const durationMs =
    mode === "countDown" ? (options.durationMs ?? 0) : (options.durationMs ?? null);

  if (mode === "countDown" && (durationMs === null || durationMs <= 0)) {
    throw new Error("countDown timer requires a positive durationMs");
  }

  let status: TimerStatus = "idle";
  let accumulatedMs = 0;
  let segmentStartedAt: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let timeoutFired = false;

  const listeners = new Set<(snapshot: TimerSnapshot) => void>();
  const timeoutListeners = new Set<() => void>();

  function activeElapsed(): number {
    if (status === "running" && segmentStartedAt !== null) {
      return accumulatedMs + (clock.now() - segmentStartedAt);
    }
    return accumulatedMs;
  }

  function snapshot(): TimerSnapshot {
    const elapsedMs = Math.max(0, Math.floor(activeElapsed()));
    let remainingMs: number | null = null;
    if (mode === "countDown" && durationMs !== null) {
      remainingMs = Math.max(0, durationMs - elapsedMs);
    }
    return {
      mode,
      status,
      elapsedMs,
      remainingMs,
      durationMs,
    };
  }

  function notify(): void {
    const snap = snapshot();
    for (const listener of listeners) {
      listener(snap);
    }
    if (
      mode === "countDown" &&
      durationMs !== null &&
      snap.elapsedMs >= durationMs &&
      !timeoutFired
    ) {
      timeoutFired = true;
      status = "elapsed";
      stopTicking();
      for (const listener of timeoutListeners) {
        listener();
      }
    }
  }

  function stopTicking(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTicking(): void {
    stopTicking();
    if (mode === "none") return;
    intervalId = setInterval(() => notify(), tickMs);
  }

  return {
    mode,
    start() {
      if (status === "running" || status === "elapsed") return;
      status = "running";
      segmentStartedAt = clock.now();
      startTicking();
      notify();
    },
    pause() {
      if (status !== "running") return;
      accumulatedMs = activeElapsed();
      segmentStartedAt = null;
      status = "paused";
      stopTicking();
      notify();
    },
    resume() {
      if (status !== "paused") return;
      status = "running";
      segmentStartedAt = clock.now();
      startTicking();
      notify();
    },
    reset() {
      stopTicking();
      status = "idle";
      accumulatedMs = 0;
      segmentStartedAt = null;
      timeoutFired = false;
      notify();
    },
    getSnapshot: snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    onTimeout(listener) {
      timeoutListeners.add(listener);
      return () => {
        timeoutListeners.delete(listener);
      };
    },
    dispose() {
      stopTicking();
      listeners.clear();
      timeoutListeners.clear();
    },
  };
}
