/**
 * Pure autosave state machine (no React, no I/O).
 *
 * States: clean | dirty | saving | saved | error | conflict
 * Debounce timing is external; this machine only tracks phase + revisions.
 *
 * @see docs/adr/ADR-004-autosave-revision.md
 * @see agent-work/shared/CONTRACTS.md §14
 * @see FUNWALL_MASTER_PLAN.md §5.2
 */

export const AUTOSAVE_DEBOUNCE_MS = 800;

export type AutosavePhase =
  | "clean"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

export interface AutosaveConflict {
  serverRevision: number;
  /** Opaque server activity snapshot for keep/load UI. */
  snapshot: unknown;
}

export interface AutosaveMachineState {
  phase: AutosavePhase;
  /** Last acknowledged server revision (CAS base). */
  baseRevision: number;
  /** Monotonic local edit sequence; increments on every edit. */
  dirtySeq: number;
  /** Last dirtySeq successfully acknowledged by the server. */
  acknowledgedSeq: number;
  /** dirtySeq currently in flight, or null. */
  inFlightSeq: number | null;
  /**
   * When true, a save should start as soon as no request is in flight.
   * Set by debounce fire or explicit flush (Done / visibilitychange).
   */
  saveRequested: boolean;
  lastSavedAt: string | null;
  errorMessage: string | null;
  conflict: AutosaveConflict | null;
}

export type AutosaveEvent =
  | { type: "HYDRATE"; baseRevision: number }
  | { type: "EDIT" }
  | { type: "DEBOUNCE_ELAPSED" }
  | { type: "FLUSH" }
  | { type: "SAVE_START"; seq: number }
  | {
      type: "SAVE_SUCCESS";
      seq: number;
      revision: number;
      updatedAt: string;
    }
  | { type: "SAVE_ERROR"; seq: number; message: string }
  | {
      type: "SAVE_CONFLICT";
      seq: number;
      serverRevision: number;
      snapshot: unknown;
    }
  | { type: "RETRY" }
  | { type: "RESOLVE_KEEP_LOCAL" }
  | { type: "RESOLVE_USE_SERVER"; serverRevision: number };

export function createAutosaveState(
  baseRevision = 0,
): AutosaveMachineState {
  return {
    phase: "clean",
    baseRevision,
    dirtySeq: 0,
    acknowledgedSeq: 0,
    inFlightSeq: null,
    saveRequested: false,
    lastSavedAt: null,
    errorMessage: null,
    conflict: null,
  };
}

export function reduceAutosave(
  state: AutosaveMachineState,
  event: AutosaveEvent,
): AutosaveMachineState {
  switch (event.type) {
    case "HYDRATE":
      return {
        ...createAutosaveState(event.baseRevision),
        phase: "clean",
      };

    case "EDIT": {
      if (state.phase === "conflict") {
        // Preserve conflict until resolved; still track newer local edits.
        return {
          ...state,
          dirtySeq: state.dirtySeq + 1,
          errorMessage: null,
        };
      }
      return {
        ...state,
        phase: "dirty",
        dirtySeq: state.dirtySeq + 1,
        errorMessage: null,
        conflict: null,
        // Typing resets debounce; explicit FLUSH still works.
        saveRequested: false,
      };
    }

    case "DEBOUNCE_ELAPSED": {
      if (state.phase === "conflict") {
        return state;
      }
      if (state.dirtySeq === state.acknowledgedSeq) {
        return state;
      }
      return {
        ...state,
        saveRequested: true,
      };
    }

    case "FLUSH": {
      if (state.phase === "conflict") {
        return state;
      }
      if (state.dirtySeq === state.acknowledgedSeq && state.phase !== "error") {
        return state;
      }
      return {
        ...state,
        saveRequested: true,
      };
    }

    case "SAVE_START": {
      if (state.inFlightSeq !== null) {
        return state;
      }
      if (event.seq !== state.dirtySeq) {
        return state;
      }
      return {
        ...state,
        phase: "saving",
        inFlightSeq: event.seq,
        saveRequested: false,
        errorMessage: null,
      };
    }

    case "SAVE_SUCCESS": {
      // Stale response: a newer edit or different in-flight must not clobber.
      if (state.inFlightSeq !== event.seq) {
        return state;
      }

      const fullyAcknowledged = event.seq === state.dirtySeq;
      return {
        ...state,
        inFlightSeq: null,
        baseRevision: event.revision,
        acknowledgedSeq: event.seq,
        lastSavedAt: event.updatedAt,
        errorMessage: null,
        conflict: null,
        phase: fullyAcknowledged ? "saved" : "dirty",
        // If edits landed during flight, request another save immediately.
        saveRequested: !fullyAcknowledged,
      };
    }

    case "SAVE_ERROR": {
      if (state.inFlightSeq !== event.seq) {
        return state;
      }
      return {
        ...state,
        inFlightSeq: null,
        phase: "error",
        errorMessage: event.message,
        saveRequested: false,
      };
    }

    case "SAVE_CONFLICT": {
      if (state.inFlightSeq !== event.seq) {
        return state;
      }
      return {
        ...state,
        inFlightSeq: null,
        phase: "conflict",
        saveRequested: false,
        errorMessage: null,
        conflict: {
          serverRevision: event.serverRevision,
          snapshot: event.snapshot,
        },
      };
    }

    case "RETRY": {
      if (state.phase !== "error") {
        return state;
      }
      return {
        ...state,
        phase: "dirty",
        errorMessage: null,
        saveRequested: true,
      };
    }

    case "RESOLVE_KEEP_LOCAL": {
      if (state.phase !== "conflict" || !state.conflict) {
        return state;
      }
      // Keep local payload; advance base to server so CAS can succeed after merge strategy.
      // Caller is responsible for re-submitting local patch against the new base
      // only after intentionally overwriting (product may prefer force path later).
      return {
        ...state,
        phase: "dirty",
        baseRevision: state.conflict.serverRevision,
        conflict: null,
        saveRequested: true,
      };
    }

    case "RESOLVE_USE_SERVER": {
      if (state.phase !== "conflict") {
        return state;
      }
      return {
        ...createAutosaveState(event.serverRevision),
        phase: "saved",
        lastSavedAt: new Date().toISOString(),
      };
    }

    default: {
      const _exhaustive: never = event;
      void _exhaustive;
      return state;
    }
  }
}

/** True when a save request should begin now. */
export function shouldStartSave(state: AutosaveMachineState): boolean {
  return (
    state.saveRequested &&
    state.inFlightSeq === null &&
    state.dirtySeq > state.acknowledgedSeq &&
    state.phase !== "conflict" &&
    (state.phase === "dirty" ||
      state.phase === "error" ||
      state.phase === "saved" ||
      state.phase === "clean" ||
      state.phase === "saving")
  );
}

/** Local edits not yet acknowledged. */
export function hasUnsavedChanges(state: AutosaveMachineState): boolean {
  return (
    state.dirtySeq > state.acknowledgedSeq ||
    state.phase === "dirty" ||
    state.phase === "saving" ||
    state.phase === "error" ||
    state.phase === "conflict"
  );
}

/** Status label for AutosaveStatus UI. */
export function autosaveStatusLabel(phase: AutosavePhase): string {
  switch (phase) {
    case "clean":
      return "";
    case "dirty":
      return "";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    case "conflict":
      return "Conflict";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}
