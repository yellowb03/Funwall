/**
 * Pure seeded word-search board generator.
 * No DOM. Deterministic for (words, settings, seed).
 * Bounded attempt budget — never hangs on crafted input.
 *
 * @see FUNWALL_MASTER_PLAN.md §8.4
 */

import type { WordsearchEntry } from "@/domain/content/wordsearch.v1";
import type { SeededRng, RngStream } from "@/services/rng/seeded-rng";
import { createSeededRng } from "@/services/rng/seeded-rng";
import {
  LATIN_FILLER_ALPHABET,
  normalizeWord,
  resolveNormalizedWord,
} from "@/features/templates/wordsearch/normalize";
import type {
  WordsearchDiacriticPolicy,
  WordsearchSettings,
} from "@/features/templates/wordsearch/settings";

/** Bump when placement heuristics change (stored in result detail). */
export const WORDSEARCH_GENERATOR_VERSION = 1;

export const WORDSEARCH_MIN_GRID = 4;
export const WORDSEARCH_MAX_GRID = 20;

/** Per-word placement tries before giving up on this size/order. */
export const MAX_ATTEMPTS_PER_WORD = 120;

/** Global placement attempts across all words and size growth. */
export const MAX_TOTAL_ATTEMPTS = 8_000;

/** Order reshuffles before growing the grid. */
export const MAX_ORDER_RETRIES = 3;

export interface GridCell {
  row: number;
  col: number;
}

export interface WordPlacement {
  wordId: string;
  displayWord: string;
  normalizedWord: string;
  /** Ordered cells from first letter to last. */
  path: GridCell[];
  /** Direction delta used for placement. */
  direction: { dr: number; dc: number };
}

export interface GenerateSuccess {
  ok: true;
  grid: string[][];
  rows: number;
  cols: number;
  placements: WordPlacement[];
  generatorVersion: number;
  seed: string;
}

export type GenerateFailureReason =
  | "empty"
  | "too_few"
  | "duplicate"
  | "charset"
  | "too_long"
  | "too_short"
  | "placement_failed"
  | "budget";

export interface GenerateFailure {
  ok: false;
  reason: GenerateFailureReason;
  problematicWords: string[];
  message: string;
  attemptsUsed: number;
}

export type GenerateResult = GenerateSuccess | GenerateFailure;

export interface GeneratorWordInput {
  id: string;
  displayWord: string;
  normalizedWord: string;
}

export interface GenerateOptions {
  allowDiagonal: boolean;
  allowReverse: boolean;
  diacriticPolicy?: WordsearchDiacriticPolicy;
  /** Override alphabet for filler (default Latin A–Z). */
  fillerAlphabet?: string;
  maxGrid?: number;
  minGrid?: number;
  maxTotalAttempts?: number;
  maxAttemptsPerWord?: number;
}

interface Direction {
  dr: number;
  dc: number;
}

/** Base directions: E, S (always). SE, SW when diagonal. */
function baseDirections(allowDiagonal: boolean): Direction[] {
  const dirs: Direction[] = [
    { dr: 0, dc: 1 }, // E
    { dr: 1, dc: 0 }, // S
  ];
  if (allowDiagonal) {
    dirs.push({ dr: 1, dc: 1 }); // SE
    dirs.push({ dr: 1, dc: -1 }); // SW
  }
  return dirs;
}

/** Expand with reverse (W, N, NW, NE) when allowed. */
export function allowedDirections(
  allowDiagonal: boolean,
  allowReverse: boolean,
): Direction[] {
  const base = baseDirections(allowDiagonal);
  if (!allowReverse) return base;
  const reversed = base.map((d) => ({ dr: -d.dr, dc: -d.dc }));
  return [...base, ...reversed];
}

function emptyGrid(rows: number, cols: number): (string | null)[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  );
}

/**
 * Minimum square grid that can fit the longest word and roughly total letters.
 */
export function calculateMinGridSize(
  normalizedWords: readonly string[],
  minGrid = WORDSEARCH_MIN_GRID,
  maxGrid = WORDSEARCH_MAX_GRID,
): number {
  if (normalizedWords.length === 0) return minGrid;
  const longest = Math.max(...normalizedWords.map((w) => w.length));
  const totalLetters = normalizedWords.reduce((s, w) => s + w.length, 0);
  // Heuristic: area ~ 1.8× letter mass, side = ceil(sqrt)
  const byArea = Math.ceil(Math.sqrt(totalLetters * 1.8));
  const size = Math.max(longest, byArea, minGrid);
  return Math.min(size, maxGrid);
}

interface CandidatePlacement {
  row: number;
  col: number;
  direction: Direction;
  /** Intersection score: cells that already match the letter. */
  score: number;
}

function pathFor(
  row: number,
  col: number,
  direction: Direction,
  length: number,
): GridCell[] {
  const path: GridCell[] = [];
  for (let i = 0; i < length; i += 1) {
    path.push({ row: row + direction.dr * i, col: col + direction.dc * i });
  }
  return path;
}

function inBounds(
  row: number,
  col: number,
  rows: number,
  cols: number,
): boolean {
  return row >= 0 && col >= 0 && row < rows && col < cols;
}

/**
 * Score a placement: -1 if invalid (conflict/OOB), else count of matching overlaps.
 */
function scorePlacement(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  let score = 0;
  for (let i = 0; i < word.length; i += 1) {
    const r = row + direction.dr * i;
    const c = col + direction.dc * i;
    if (!inBounds(r, c, rows, cols)) return -1;
    const existing = grid[r]![c];
    const letter = word[i]!;
    if (existing !== null && existing !== letter) return -1;
    if (existing === letter) score += 1;
  }
  return score;
}

function collectCandidates(
  grid: (string | null)[][],
  word: string,
  directions: readonly Direction[],
  rng: RngStream,
): CandidatePlacement[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const candidates: CandidatePlacement[] = [];

  for (const direction of directions) {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const score = scorePlacement(grid, word, row, col, direction);
        if (score >= 0) {
          candidates.push({ row, col, direction, score });
        }
      }
    }
  }

  // Deterministic shuffle then stable sort by score descending (prefer intersections).
  const shuffled = rng.shuffle(candidates);
  shuffled.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: row, col, direction for full determinism after shuffle order
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    if (a.direction.dr !== b.direction.dr) return a.direction.dr - b.direction.dr;
    return a.direction.dc - b.direction.dc;
  });

  return shuffled;
}

function applyPlacement(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
): void {
  for (let i = 0; i < word.length; i += 1) {
    const r = row + direction.dr * i;
    const c = col + direction.dc * i;
    grid[r]![c] = word[i]!;
  }
}

function cloneGrid(grid: (string | null)[][]): (string | null)[][] {
  return grid.map((row) => [...row]);
}

interface PlaceAllResult {
  ok: boolean;
  grid: (string | null)[][];
  placements: WordPlacement[];
  attempts: number;
  failedWord?: GeneratorWordInput;
}

function placeAllWords(
  words: readonly GeneratorWordInput[],
  size: number,
  directions: readonly Direction[],
  rng: RngStream,
  maxAttemptsPerWord: number,
  remainingBudget: { left: number },
): PlaceAllResult {
  const grid = emptyGrid(size, size);
  const placements: WordPlacement[] = [];
  let attempts = 0;

  for (const word of words) {
    if (remainingBudget.left <= 0) {
      return { ok: false, grid, placements, attempts, failedWord: word };
    }

    const candidates = collectCandidates(
      grid,
      word.normalizedWord,
      directions,
      rng,
    );
    remainingBudget.left -= 1; // candidate collection costs one unit
    attempts += 1;

    if (candidates.length === 0) {
      return { ok: false, grid, placements, attempts, failedWord: word };
    }

    const limit = Math.min(maxAttemptsPerWord, candidates.length);
    let placed = false;

    for (let i = 0; i < limit; i += 1) {
      if (remainingBudget.left <= 0) break;
      remainingBudget.left -= 1;
      attempts += 1;

      const c = candidates[i]!;
      // Re-score in case (should still be valid — we place sequentially)
      const score = scorePlacement(
        grid,
        word.normalizedWord,
        c.row,
        c.col,
        c.direction,
      );
      if (score < 0) continue;

      applyPlacement(
        grid,
        word.normalizedWord,
        c.row,
        c.col,
        c.direction,
      );
      placements.push({
        wordId: word.id,
        displayWord: word.displayWord,
        normalizedWord: word.normalizedWord,
        path: pathFor(c.row, c.col, c.direction, word.normalizedWord.length),
        direction: { ...c.direction },
      });
      placed = true;
      break;
    }

    if (!placed) {
      return { ok: false, grid, placements, attempts, failedWord: word };
    }
  }

  return { ok: true, grid, placements, attempts };
}

function fillFiller(
  grid: (string | null)[][],
  alphabet: string,
  rng: RngStream,
): string[][] {
  const letters = alphabet.length > 0 ? alphabet : LATIN_FILLER_ALPHABET;
  return grid.map((row) =>
    row.map((cell) => {
      if (cell !== null) return cell;
      const idx = rng.int(0, letters.length - 1);
      return letters[idx]!;
    }),
  );
}

/**
 * Prepare and validate words for generation.
 */
export function prepareWordsForGeneration(
  entries: readonly GeneratorWordInput[],
  diacriticPolicy: WordsearchDiacriticPolicy = "fold",
):
  | { ok: true; words: GeneratorWordInput[] }
  | { ok: false; failure: GenerateFailure } {
  if (entries.length === 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        reason: "empty",
        problematicWords: [],
        message: "Add at least 2 words.",
        attemptsUsed: 0,
      },
    };
  }

  const prepared: GeneratorWordInput[] = [];
  const seen = new Map<string, string>();

  for (const entry of entries) {
    const result = resolveNormalizedWord(entry.displayWord, entry.normalizedWord, {
      diacriticPolicy,
      maxLength: WORDSEARCH_MAX_GRID,
    });

    if (!result.ok) {
      const reason: GenerateFailureReason =
        result.error === "unsupported_charset"
          ? "charset"
          : result.error === "too_long"
            ? "too_long"
            : result.error === "too_short"
              ? "too_short"
              : "empty";
      return {
        ok: false,
        failure: {
          ok: false,
          reason,
          problematicWords: [entry.displayWord || entry.normalizedWord],
          message: result.message ?? "Invalid word.",
          attemptsUsed: 0,
        },
      };
    }

    const prior = seen.get(result.normalizedWord);
    if (prior !== undefined) {
      return {
        ok: false,
        failure: {
          ok: false,
          reason: "duplicate",
          problematicWords: [entry.displayWord, prior],
          message: `“${entry.displayWord}” matches another word after normalization.`,
          attemptsUsed: 0,
        },
      };
    }
    seen.set(result.normalizedWord, entry.displayWord);

    prepared.push({
      id: entry.id,
      displayWord: result.displayWord || entry.displayWord,
      normalizedWord: result.normalizedWord,
    });
  }

  if (prepared.length < 2) {
    return {
      ok: false,
      failure: {
        ok: false,
        reason: "too_few",
        problematicWords: prepared.map((w) => w.displayWord),
        message: "Add at least 2 words.",
        attemptsUsed: 0,
      },
    };
  }

  return { ok: true, words: prepared };
}

/**
 * Generate a word-search board.
 * Uses the `board` RNG stream exclusively for placement/filler.
 */
export function generateWordsearch(
  entries: readonly GeneratorWordInput[],
  seed: string,
  options: GenerateOptions,
): GenerateResult {
  const maxGrid = options.maxGrid ?? WORDSEARCH_MAX_GRID;
  const minGrid = options.minGrid ?? WORDSEARCH_MIN_GRID;
  const maxTotalAttempts = options.maxTotalAttempts ?? MAX_TOTAL_ATTEMPTS;
  const maxAttemptsPerWord =
    options.maxAttemptsPerWord ?? MAX_ATTEMPTS_PER_WORD;
  const alphabet = options.fillerAlphabet ?? LATIN_FILLER_ALPHABET;

  const prepared = prepareWordsForGeneration(
    entries,
    options.diacriticPolicy ?? "fold",
  );
  if (!prepared.ok) return prepared.failure;

  const words = prepared.words;
  const directions = allowedDirections(
    options.allowDiagonal,
    options.allowReverse,
  );

  // Longest-first placement is more reliable; stable by normalized word then id.
  const sorted = [...words].sort((a, b) => {
    if (b.normalizedWord.length !== a.normalizedWord.length) {
      return b.normalizedWord.length - a.normalizedWord.length;
    }
    if (a.normalizedWord < b.normalizedWord) return -1;
    if (a.normalizedWord > b.normalizedWord) return 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const rng = createSeededRng(seed);
  const board = rng.stream("board");
  const remainingBudget = { left: maxTotalAttempts };
  let attemptsUsed = 0;
  let lastFailed: string | undefined;

  const minSize = calculateMinGridSize(
    sorted.map((w) => w.normalizedWord),
    minGrid,
    maxGrid,
  );

  for (let size = minSize; size <= maxGrid; size += 1) {
    for (let orderTry = 0; orderTry < MAX_ORDER_RETRIES; orderTry += 1) {
      if (remainingBudget.left <= 0) {
        return {
          ok: false,
          reason: "budget",
          problematicWords: lastFailed ? [lastFailed] : sorted.map((w) => w.displayWord),
          message:
            "Could not place every word within the time budget. Try fewer or shorter words.",
          attemptsUsed,
        };
      }

      // First try: sorted longest-first. Later tries: RNG reshuffle of order.
      const order =
        orderTry === 0 ? sorted : board.shuffle(sorted);

      const result = placeAllWords(
        order,
        size,
        directions,
        board,
        maxAttemptsPerWord,
        remainingBudget,
      );
      attemptsUsed += result.attempts;

      if (result.ok) {
        const filled = fillFiller(result.grid, alphabet, board);
        // Reorder placements to match original entry order for stable UI
        const byId = new Map(result.placements.map((p) => [p.wordId, p]));
        const orderedPlacements = words
          .map((w) => byId.get(w.id))
          .filter((p): p is WordPlacement => p !== undefined);

        return {
          ok: true,
          grid: filled,
          rows: size,
          cols: size,
          placements: orderedPlacements,
          generatorVersion: WORDSEARCH_GENERATOR_VERSION,
          seed,
        };
      }

      lastFailed = result.failedWord?.displayWord;
    }
  }

  return {
    ok: false,
    reason: remainingBudget.left <= 0 ? "budget" : "placement_failed",
    problematicWords: lastFailed
      ? [lastFailed]
      : sorted.map((w) => w.displayWord),
    message: lastFailed
      ? `Could not place every word. Try shorter words or turn on more directions: ${lastFailed}.`
      : "Could not place every word. Try shorter words or turn on more directions.",
    attemptsUsed,
  };
}

/**
 * Convenience: generate from domain content entries + settings + rng.
 */
export function generateFromContent(
  words: readonly WordsearchEntry[],
  settings: Pick<
    WordsearchSettings,
    "allowDiagonal" | "allowReverse" | "diacriticPolicy"
  >,
  rng: SeededRng,
): GenerateResult {
  return generateWordsearch(
    words.map((w) => ({
      id: w.id,
      displayWord: w.displayWord,
      normalizedWord: w.normalizedWord,
    })),
    rng.seed,
    {
      allowDiagonal: settings.allowDiagonal,
      allowReverse: settings.allowReverse,
      diacriticPolicy: settings.diacriticPolicy,
    },
  );
}

/**
 * Verify every placement exists on the grid exactly as recorded.
 * Used by tests and defensive player checks.
 */
export function verifyPlacementsOnGrid(
  grid: string[][],
  placements: readonly WordPlacement[],
): boolean {
  for (const p of placements) {
    if (p.path.length !== p.normalizedWord.length) return false;
    for (let i = 0; i < p.path.length; i += 1) {
      const cell = p.path[i]!;
      if (
        cell.row < 0 ||
        cell.col < 0 ||
        cell.row >= grid.length ||
        cell.col >= (grid[0]?.length ?? 0)
      ) {
        return false;
      }
      if (grid[cell.row]![cell.col] !== p.normalizedWord[i]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Read letters along a straight path (inclusive endpoints).
 * Returns null if not a straight H/V/diagonal line.
 */
export function lettersAlongPath(
  grid: string[][],
  start: GridCell,
  end: GridCell,
): { letters: string; path: GridCell[] } | null {
  const path = straightLinePath(start, end);
  if (!path) return null;
  const letters: string[] = [];
  for (const cell of path) {
    const row = grid[cell.row];
    if (!row || cell.col < 0 || cell.col >= row.length) return null;
    letters.push(row[cell.col]!);
  }
  return { letters: letters.join(""), path };
}

/**
 * Build inclusive straight-line path between two cells.
 * Only axis-aligned or 45° diagonal. Returns null for bends / single-point still ok.
 */
export function straightLinePath(
  start: GridCell,
  end: GridCell,
): GridCell[] | null {
  const dr = end.row - start.row;
  const dc = end.col - start.col;

  if (dr === 0 && dc === 0) {
    return [{ row: start.row, col: start.col }];
  }

  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  // Must be H, V, or perfect diagonal
  if (dr !== 0 && dc !== 0 && absR !== absC) {
    return null;
  }

  const steps = Math.max(absR, absC);
  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;

  const path: GridCell[] = [];
  for (let i = 0; i <= steps; i += 1) {
    path.push({
      row: start.row + stepR * i,
      col: start.col + stepC * i,
    });
  }
  return path;
}

/** Re-export for editor live preview of normalize. */
export { normalizeWord };
