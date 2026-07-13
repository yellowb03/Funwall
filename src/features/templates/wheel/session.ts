import type { ListContentV1, ListItem } from "@/domain/content/list.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";

/**
 * Session-only wheel state. Never mutates the saved content pack.
 */

export type WheelPhase =
  | "intro"
  | "idle"
  | "spinning"
  | "decelerating"
  | "selected"
  | "complete";

export interface WheelSessionState {
  /** Original items from the snapshot (immutable reference order after optional shuffle). */
  originalItems: readonly ListItem[];
  /** Remaining playable item IDs in wheel order. */
  remainingIds: string[];
  phase: WheelPhase;
  /** Last selected item id (if any). */
  selectedId: string | null;
  /** Items eliminated this session (order of elimination). */
  eliminatedIds: string[];
  /** Current wheel rotation in degrees. */
  rotationDeg: number;
  /** Locked while animating so rapid clicks cannot start overlapping spins. */
  inputLocked: boolean;
}

export function buildSessionItems(
  content: ListContentV1,
  settings: { shuffleItemOrder: boolean },
  rng: SeededRng,
): ListItem[] {
  const items = content.items.map((item) => ({
    id: item.id,
    content: { ...item.content },
  }));
  if (settings.shuffleItemOrder) {
    return rng.stream("contentOrder").shuffle(items);
  }
  return items;
}

export function createWheelSession(
  content: ListContentV1,
  settings: { shuffleItemOrder: boolean },
  rng: SeededRng,
): WheelSessionState {
  const originalItems = buildSessionItems(content, settings, rng);
  const remainingIds = originalItems.map((i) => i.id);
  const phase: WheelPhase =
    remainingIds.length <= 1 ? "complete" : "intro";

  return {
    originalItems,
    remainingIds,
    phase,
    selectedId: null,
    eliminatedIds: [],
    rotationDeg: 0,
    inputLocked: false,
  };
}

export function remainingItems(state: WheelSessionState): ListItem[] {
  const byId = new Map(state.originalItems.map((i) => [i.id, i]));
  return state.remainingIds
    .map((id) => byId.get(id))
    .filter((item): item is ListItem => item !== undefined);
}

/**
 * Pick a winner from remaining items using the `board` stream.
 * Must be called at spin start, before animation.
 */
export function selectWinnerId(
  remainingIds: readonly string[],
  rng: SeededRng,
): string {
  if (remainingIds.length === 0) {
    throw new Error("Cannot select a winner from an empty wheel");
  }
  return rng.stream("board").pick([...remainingIds]);
}

export function canSpin(state: WheelSessionState): boolean {
  return (
    !state.inputLocked &&
    state.remainingIds.length >= 2 &&
    (state.phase === "intro" ||
      state.phase === "idle" ||
      state.phase === "selected")
  );
}

export function beginSpin(
  state: WheelSessionState,
  winnerId: string,
): WheelSessionState {
  if (!canSpin(state)) {
    return state;
  }
  if (!state.remainingIds.includes(winnerId)) {
    throw new Error("Winner must be in remaining set");
  }
  return {
    ...state,
    phase: "spinning",
    inputLocked: true,
    selectedId: winnerId,
  };
}

export function markDecelerating(state: WheelSessionState): WheelSessionState {
  if (state.phase !== "spinning") return state;
  return { ...state, phase: "decelerating" };
}

export function markSelected(
  state: WheelSessionState,
  rotationDeg: number,
): WheelSessionState {
  return {
    ...state,
    phase: "selected",
    inputLocked: false,
    rotationDeg,
  };
}

/**
 * Eliminate selected item from session remaining set only.
 * Does not mutate originalItems / content pack.
 */
export function eliminateSelected(
  state: WheelSessionState,
  allowEliminate: boolean,
): WheelSessionState {
  if (!allowEliminate || !state.selectedId) {
    return state;
  }
  if (state.phase !== "selected") {
    return state;
  }

  const selectedId = state.selectedId;
  const remainingIds = state.remainingIds.filter((id) => id !== selectedId);
  const eliminatedIds = [...state.eliminatedIds, selectedId];

  if (remainingIds.length <= 1) {
    return {
      ...state,
      remainingIds,
      eliminatedIds,
      selectedId: remainingIds[0] ?? selectedId,
      phase: "complete",
      inputLocked: false,
      // Keep rotation; geometry rebuilds on next render for remaining set
      rotationDeg: 0,
    };
  }

  return {
    ...state,
    remainingIds,
    eliminatedIds,
    selectedId: null,
    phase: "idle",
    inputLocked: false,
    rotationDeg: 0,
  };
}

export function resumeFromSelected(state: WheelSessionState): WheelSessionState {
  if (state.phase !== "selected") return state;
  return {
    ...state,
    phase: "idle",
    selectedId: null,
    inputLocked: false,
  };
}

export function spinAgainFromSelected(
  state: WheelSessionState,
): WheelSessionState {
  if (state.phase !== "selected") return state;
  return {
    ...state,
    phase: "idle",
    // Keep selectedId cleared so a new spin can choose freely
    selectedId: null,
    inputLocked: false,
  };
}

/**
 * Restart restores original remaining set (session original order).
 * Shell may remount; this supports adapter.restart().
 */
export function restartSession(state: WheelSessionState): WheelSessionState {
  return {
    originalItems: state.originalItems,
    remainingIds: state.originalItems.map((i) => i.id),
    phase: state.originalItems.length <= 1 ? "complete" : "intro",
    selectedId: null,
    eliminatedIds: [],
    rotationDeg: 0,
    inputLocked: false,
  };
}

/**
 * Build unscored result detail for session completion / abandon.
 */
export function buildWheelResultDetail(state: WheelSessionState): {
  version: number;
  data: {
    selectedIds: string[];
    eliminatedIds: string[];
    remainingIds: string[];
  };
} {
  return {
    version: 1,
    data: {
      selectedIds: state.selectedId ? [state.selectedId] : [],
      eliminatedIds: [...state.eliminatedIds],
      remainingIds: [...state.remainingIds],
    },
  };
}
