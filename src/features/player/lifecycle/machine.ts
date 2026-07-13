/**
 * Pure player lifecycle state machine.
 * @see agent-work/shared/CONTRACTS.md §7
 * @see FUNWALL_MASTER_PLAN.md §7.1
 */

export type PlayerLifecycleState =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "feedback"
  | "completed"
  | "gameOver"
  | "review";

/** Allowed transitions. Template sub-states live inside playing/feedback only. */
export const LIFECYCLE_TRANSITIONS: Readonly<
  Record<PlayerLifecycleState, readonly PlayerLifecycleState[]>
> = {
  loading: ["ready"],
  ready: ["playing"],
  playing: ["paused", "feedback", "completed", "gameOver"],
  paused: ["playing", "completed", "gameOver"],
  feedback: ["playing", "completed", "gameOver"],
  completed: ["review"],
  gameOver: ["review"],
  review: [],
} as const;

export class IllegalLifecycleTransitionError extends Error {
  readonly from: PlayerLifecycleState;
  readonly to: PlayerLifecycleState;

  constructor(from: PlayerLifecycleState, to: PlayerLifecycleState) {
    super(`Illegal player lifecycle transition: ${from} -> ${to}`);
    this.name = "IllegalLifecycleTransitionError";
    this.from = from;
    this.to = to;
  }
}

export interface LifecycleMachine {
  readonly state: PlayerLifecycleState;
  canTransition(to: PlayerLifecycleState): boolean;
  transition(to: PlayerLifecycleState): PlayerLifecycleState;
  /** Force state (e.g. restart re-init to loading). Not a normal transition. */
  reset(to?: PlayerLifecycleState): PlayerLifecycleState;
}

export interface CreateLifecycleMachineOptions {
  initial?: PlayerLifecycleState;
  /**
   * When true (default in development), illegal transitions throw.
   * When false (production), illegal transitions return current state and mark fatal.
   */
  strict?: boolean;
  onIllegal?: (from: PlayerLifecycleState, to: PlayerLifecycleState) => void;
}

export function isTerminalLifecycle(state: PlayerLifecycleState): boolean {
  return state === "completed" || state === "gameOver" || state === "review";
}

export function canAcceptGameplayInput(state: PlayerLifecycleState): boolean {
  return state === "playing";
}

/**
 * Create a pure lifecycle machine. No React / DOM dependencies.
 */
export function createLifecycleMachine(
  options?: CreateLifecycleMachineOptions,
): LifecycleMachine {
  const strict =
    options?.strict ??
    (typeof process !== "undefined"
      ? process.env.NODE_ENV !== "production"
      : true);

  let state: PlayerLifecycleState = options?.initial ?? "loading";
  let fatal = false;

  return {
    get state() {
      return state;
    },
    canTransition(to) {
      if (fatal) return false;
      return LIFECYCLE_TRANSITIONS[state].includes(to);
    },
    transition(to) {
      if (fatal) {
        if (strict) {
          throw new IllegalLifecycleTransitionError(state, to);
        }
        options?.onIllegal?.(state, to);
        return state;
      }

      if (!LIFECYCLE_TRANSITIONS[state].includes(to)) {
        options?.onIllegal?.(state, to);
        if (strict) {
          throw new IllegalLifecycleTransitionError(state, to);
        }
        // Production: stay put; shell may show fatal recovery.
        fatal = true;
        return state;
      }

      state = to;
      return state;
    },
    reset(to = "loading") {
      fatal = false;
      state = to;
      return state;
    },
  };
}
