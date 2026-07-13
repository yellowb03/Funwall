/**
 * Pure Wordsearch session state and selection resolution.
 * No DOM. Reconstructable from seed + ordered actions.
 */

import type { WordsearchContentV1, WordsearchEntry } from "@/domain/content/wordsearch.v1";
import type { SeededRng } from "@/services/rng/seeded-rng";
import {
  generateFromContent,
  type GenerateSuccess,
  type GridCell,
  type WordPlacement,
  lettersAlongPath,
  straightLinePath,
} from "@/features/templates/wordsearch/generator";
import type { WordsearchSettings } from "@/features/templates/wordsearch/settings";

export type WordsearchPhase =
  | "intro"
  | "playing"
  | "feedback"
  | "completed"
  | "gameOver";

export interface FoundWordRecord {
  wordId: string;
  displayWord: string;
  normalizedWord: string;
  foundAtMs: number;
  path: GridCell[];
}

export interface WordsearchSessionState {
  phase: WordsearchPhase;
  board: GenerateSuccess | null;
  generationError: string | null;
  /** wordId → found record */
  found: Record<string, FoundWordRecord>;
  foundOrder: string[];
  livesRemaining: number | null;
  incorrectAttempts: number;
  /** Active selection anchor (drag / keyboard / tap). */
  selectionStart: GridCell | null;
  selectionEnd: GridCell | null;
  /** Highlighted path during drag (preview). */
  previewPath: GridCell[] | null;
  inputLocked: boolean;
  /** For tapFirst / tapAny assisted modes */
  assistedWordId: string | null;
}

export interface SelectionResolveResult {
  kind: "found" | "miss" | "incomplete" | "already_found" | "invalid";
  wordId?: string;
  path?: GridCell[];
  letters?: string;
}

export function createWordsearchSession(
  content: WordsearchContentV1,
  settings: WordsearchSettings,
  rng: SeededRng,
): WordsearchSessionState {
  const result = generateFromContent(content.words, settings, rng);

  if (!result.ok) {
    return {
      phase: "intro",
      board: null,
      generationError: result.message,
      found: {},
      foundOrder: [],
      livesRemaining: settings.lives,
      incorrectAttempts: 0,
      selectionStart: null,
      selectionEnd: null,
      previewPath: null,
      inputLocked: false,
      assistedWordId: null,
    };
  }

  return {
    phase: "intro",
    board: result,
    generationError: null,
    found: {},
    foundOrder: [],
    livesRemaining: settings.lives,
    incorrectAttempts: 0,
    selectionStart: null,
    selectionEnd: null,
    previewPath: null,
    inputLocked: false,
    assistedWordId: null,
  };
}

export function beginPlaying(state: WordsearchSessionState): WordsearchSessionState {
  if (state.phase !== "intro" || !state.board) return state;
  return { ...state, phase: "playing" };
}

export function unfoundPlacements(
  state: WordsearchSessionState,
): WordPlacement[] {
  if (!state.board) return [];
  return state.board.placements.filter((p) => !state.found[p.wordId]);
}

export function totalWordCount(state: WordsearchSessionState): number {
  return state.board?.placements.length ?? 0;
}

export function foundCount(state: WordsearchSessionState): number {
  return state.foundOrder.length;
}

/**
 * Match selected letters against remaining words.
 * Either selection direction is accepted (classic wordsearch).
 */
export function matchSelectionToWord(
  letters: string,
  remaining: readonly WordPlacement[],
): WordPlacement | null {
  const upper = letters.toUpperCase();
  const reversed = upper.split("").reverse().join("");
  for (const p of remaining) {
    if (p.normalizedWord === upper || p.normalizedWord === reversed) return p;
  }
  return null;
}

/**
 * Resolve a completed selection path against the board solution map.
 */
export function resolveSelection(
  state: WordsearchSessionState,
  start: GridCell,
  end: GridCell,
): SelectionResolveResult {
  if (!state.board || state.phase !== "playing" || state.inputLocked) {
    return { kind: "invalid" };
  }

  const line = lettersAlongPath(state.board.grid, start, end);
  if (!line || line.path.length < 2) {
    return { kind: "incomplete", path: line?.path, letters: line?.letters };
  }

  const remaining = unfoundPlacements(state);
  const hit = matchSelectionToWord(line.letters, remaining);
  if (hit) {
    // Path cells must match solution path (order or reverse of solution).
    if (!pathsMatch(hit.path, line.path)) {
      // Letters matched by coincidence on a different path — still accept if
      // letters equal and every cell is on the solution path set? Spec says
      // selection recognizes the recorded path. Accept letter-match when path
      // is the exact solution path or its reverse.
      return { kind: "miss", path: line.path, letters: line.letters };
    }
    return {
      kind: "found",
      wordId: hit.wordId,
      path: line.path,
      letters: line.letters,
    };
  }

  // Already found?
  for (const p of state.board.placements) {
    if (
      p.normalizedWord === line.letters.toUpperCase() &&
      state.found[p.wordId] &&
      pathsMatch(p.path, line.path)
    ) {
      return {
        kind: "already_found",
        wordId: p.wordId,
        path: line.path,
        letters: line.letters,
      };
    }
  }

  return { kind: "miss", path: line.path, letters: line.letters };
}

function pathsMatch(a: readonly GridCell[], b: readonly GridCell[]): boolean {
  if (a.length !== b.length) return false;
  let forward = true;
  let reverse = true;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i]!.row !== b[i]!.row || a[i]!.col !== b[i]!.col) forward = false;
    const j = a.length - 1 - i;
    if (a[i]!.row !== b[j]!.row || a[i]!.col !== b[j]!.col) reverse = false;
  }
  return forward || reverse;
}

/**
 * PathsEqual for accepting player selection: letter match on exact solution
 * path or reverse is enough (pathsMatch). If letters match a remaining word
 * but path differs, treat as miss to avoid freeform anagrams.
 *
 * For assisted modes, verify against known path endpoints.
 */
export function resolveSelectionLenient(
  state: WordsearchSessionState,
  start: GridCell,
  end: GridCell,
): SelectionResolveResult {
  if (!state.board || state.phase !== "playing" || state.inputLocked) {
    return { kind: "invalid" };
  }

  const line = lettersAlongPath(state.board.grid, start, end);
  if (!line || line.path.length < 2) {
    return { kind: "incomplete", path: line?.path, letters: line?.letters };
  }

  const remaining = unfoundPlacements(state);
  const upper = line.letters.toUpperCase();
  const reversed = upper.split("").reverse().join("");

  for (const p of remaining) {
    if (p.normalizedWord !== upper && p.normalizedWord !== reversed) continue;
    if (pathsMatch(p.path, line.path)) {
      return {
        kind: "found",
        wordId: p.wordId,
        path: p.path,
        letters: line.letters,
      };
    }
  }

  for (const p of state.board.placements) {
    if (
      (p.normalizedWord === upper || p.normalizedWord === reversed) &&
      state.found[p.wordId] &&
      pathsMatch(p.path, line.path)
    ) {
      return {
        kind: "already_found",
        wordId: p.wordId,
        path: line.path,
        letters: line.letters,
      };
    }
  }

  return { kind: "miss", path: line.path, letters: line.letters };
}

export function applyFound(
  state: WordsearchSessionState,
  wordId: string,
  path: GridCell[],
  foundAtMs: number,
): WordsearchSessionState {
  if (!state.board || state.found[wordId]) return clearSelection(state);

  const placement = state.board.placements.find((p) => p.wordId === wordId);
  if (!placement) return clearSelection(state);

  const found: FoundWordRecord = {
    wordId,
    displayWord: placement.displayWord,
    normalizedWord: placement.normalizedWord,
    foundAtMs,
    path,
  };

  const nextFound = { ...state.found, [wordId]: found };
  const foundOrder = [...state.foundOrder, wordId];
  const allFound = foundOrder.length >= state.board.placements.length;

  return {
    ...clearSelection(state),
    found: nextFound,
    foundOrder,
    phase: allFound ? "completed" : "playing",
    assistedWordId: null,
  };
}

export function applyMiss(
  state: WordsearchSessionState,
  settings: Pick<WordsearchSettings, "lives">,
): WordsearchSessionState {
  const incorrectAttempts = state.incorrectAttempts + 1;
  let livesRemaining = state.livesRemaining;
  let phase: WordsearchPhase = state.phase;

  if (livesRemaining !== null) {
    livesRemaining = Math.max(0, livesRemaining - 1);
    if (livesRemaining === 0) {
      phase = "gameOver";
    }
  }

  void settings;

  return {
    ...clearSelection(state),
    incorrectAttempts,
    livesRemaining,
    phase,
  };
}

export function clearSelection(
  state: WordsearchSessionState,
): WordsearchSessionState {
  return {
    ...state,
    selectionStart: null,
    selectionEnd: null,
    previewPath: null,
  };
}

export function setSelectionPreview(
  state: WordsearchSessionState,
  start: GridCell,
  end: GridCell,
): WordsearchSessionState {
  const path = straightLinePath(start, end);
  return {
    ...state,
    selectionStart: start,
    selectionEnd: end,
    previewPath: path,
  };
}

/**
 * Assisted tap modes: use solution map without exposing it.
 * tapFirst: start must be first cell of some unfound word; end completes it.
 * tapAny: start can be any cell on an unfound word; end the opposite end.
 */
export function resolveAssistedTap(
  state: WordsearchSessionState,
  mode: "tapFirst" | "tapAny",
  cell: GridCell,
): {
  state: WordsearchSessionState;
  resolve?: SelectionResolveResult;
} {
  if (!state.board || state.phase !== "playing") {
    return { state };
  }

  const remaining = unfoundPlacements(state);

  // Second tap — complete
  if (state.selectionStart) {
    const result = resolveSelectionLenient(
      state,
      state.selectionStart,
      cell,
    );
    return { state, resolve: result };
  }

  // First tap — must land on a valid start for some remaining word
  const candidates = remaining.filter((p) => {
    if (mode === "tapFirst") {
      const first = p.path[0]!;
      return first.row === cell.row && first.col === cell.col;
    }
    return p.path.some((c) => c.row === cell.row && c.col === cell.col);
  });

  if (candidates.length === 0) {
    // Invalid first tap counts as incomplete (no life cost until complete miss)
    return {
      state: {
        ...state,
        selectionStart: cell,
        selectionEnd: cell,
        previewPath: [cell],
      },
    };
  }

  // Prefer unique candidate; if several share the cell, wait for endpoint
  return {
    state: {
      ...state,
      selectionStart: cell,
      selectionEnd: cell,
      previewPath: [cell],
      assistedWordId: candidates.length === 1 ? candidates[0]!.wordId : null,
    },
  };
}

/**
 * Keyboard: extend selection by one step in a cardinal/diagonal direction.
 */
export function extendSelectionByDirection(
  state: WordsearchSessionState,
  dr: number,
  dc: number,
): WordsearchSessionState {
  if (!state.board || !state.selectionStart) return state;
  const end = state.selectionEnd ?? state.selectionStart;
  const next = { row: end.row + dr, col: end.col + dc };
  if (
    next.row < 0 ||
    next.col < 0 ||
    next.row >= state.board.rows ||
    next.col >= state.board.cols
  ) {
    return state;
  }
  // Keep straight line from start
  const path = straightLinePath(state.selectionStart, next);
  if (!path) return state;
  return {
    ...state,
    selectionEnd: next,
    previewPath: path,
  };
}

export function restartSession(
  content: WordsearchContentV1,
  settings: WordsearchSettings,
  rng: SeededRng,
): WordsearchSessionState {
  return createWordsearchSession(content, settings, rng);
}

export function entryById(
  content: WordsearchContentV1,
  id: string,
): WordsearchEntry | undefined {
  return content.words.find((w) => w.id === id);
}

export function buildWordsearchResultDetail(state: WordsearchSessionState): {
  version: number;
  data: {
    foundCount: number;
    totalCount: number;
    incorrectAttempts: number;
    livesRemaining: number | null;
    foundOrder: string[];
    missedWordIds: string[];
    seed: string | null;
    gridRows: number | null;
    gridCols: number | null;
    generatorVersion: number | null;
    placements: Array<{
      wordId: string;
      path: GridCell[];
      found: boolean;
    }>;
  };
} {
  const placements = state.board?.placements ?? [];
  const missedWordIds = placements
    .filter((p) => !state.found[p.wordId])
    .map((p) => p.wordId);

  return {
    version: 1,
    data: {
      foundCount: state.foundOrder.length,
      totalCount: placements.length,
      incorrectAttempts: state.incorrectAttempts,
      livesRemaining: state.livesRemaining,
      foundOrder: [...state.foundOrder],
      missedWordIds,
      seed: state.board?.seed ?? null,
      gridRows: state.board?.rows ?? null,
      gridCols: state.board?.cols ?? null,
      generatorVersion: state.board?.generatorVersion ?? null,
      placements: placements.map((p) => ({
        wordId: p.wordId,
        path: p.path,
        found: Boolean(state.found[p.wordId]),
      })),
    },
  };
}

/**
 * Score: words found (primary). Optional secondary from lives/time is shell-owned.
 */
export function computeScore(state: WordsearchSessionState): number {
  return state.foundOrder.length;
}

export function computeAccuracy(state: WordsearchSessionState): number | null {
  const total = totalWordCount(state);
  if (total === 0) return null;
  const attempts = state.foundOrder.length + state.incorrectAttempts;
  if (attempts === 0) return null;
  return state.foundOrder.length / attempts;
}
