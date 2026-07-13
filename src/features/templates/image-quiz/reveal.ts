import type { SeededRng } from "@/services/rng/seeded-rng";

/**
 * Pure logical tile reveal algorithm for Image Quiz.
 *
 * Logical grid is independent of viewport pixels. Resize remaps visual geometry
 * without changing the revealed set or order.
 *
 * @see FUNWALL_MASTER_PLAN.md §8.5
 */

export const DEFAULT_LANDSCAPE_COLS = 12;
export const DEFAULT_LANDSCAPE_ROWS = 8;

/** Inclusive bounds on total logical tiles. */
export const MIN_TILE_COUNT = 24;
export const MAX_TILE_COUNT = 160;

export interface TileGridSize {
  cols: number;
  rows: number;
}

export interface TileGridPolicy {
  /** Explicit override; when set, aspect adaptation is skipped. */
  override?: TileGridSize | null;
  /**
   * Image aspect ratio as width/height. Defaults to landscape 3/2.
   * Values &lt; 1 portrait, ≈1 square, &gt;1 landscape.
   */
  aspectRatio?: number;
}

/**
 * Choose a logical tile grid adapted by image aspect ratio.
 * Default landscape ≈12×8; portrait/square rebalance columns/rows.
 * Total tile count stays within [MIN_TILE_COUNT, MAX_TILE_COUNT].
 */
export function computeTileGrid(policy?: TileGridPolicy): TileGridSize {
  if (policy?.override && policy.override.cols >= 2 && policy.override.rows >= 2) {
    const cols = clampInt(policy.override.cols, 2, 24);
    const rows = clampInt(policy.override.rows, 2, 24);
    return clampTileCount({ cols, rows });
  }

  const aspect =
    typeof policy?.aspectRatio === "number" &&
    Number.isFinite(policy.aspectRatio) &&
    policy.aspectRatio > 0
      ? policy.aspectRatio
      : 3 / 2;

  // Target ~96 tiles (12×8) scaled by aspect orientation.
  const target = 96;
  let cols: number;
  let rows: number;

  if (aspect >= 1.25) {
    // Landscape: prefer wider grids
    cols = Math.round(Math.sqrt(target * aspect));
    rows = Math.round(target / cols);
  } else if (aspect <= 0.8) {
    // Portrait: taller
    rows = Math.round(Math.sqrt(target / aspect));
    cols = Math.round(target / rows);
  } else {
    // Near-square
    const side = Math.round(Math.sqrt(target));
    cols = side;
    rows = side;
  }

  cols = clampInt(cols, 4, 20);
  rows = clampInt(rows, 4, 20);
  return clampTileCount({ cols, rows });
}

function clampTileCount(grid: TileGridSize): TileGridSize {
  let { cols, rows } = grid;
  let count = cols * rows;
  while (count > MAX_TILE_COUNT && (cols > 4 || rows > 4)) {
    if (cols >= rows && cols > 4) cols -= 1;
    else if (rows > 4) rows -= 1;
    else break;
    count = cols * rows;
  }
  while (count < MIN_TILE_COUNT) {
    if (cols <= rows) cols += 1;
    else rows += 1;
    count = cols * rows;
    if (cols > 24 || rows > 24) break;
  }
  return { cols, rows };
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/**
 * Build a seeded reveal permutation with spatial distribution.
 * Early tiles are drawn from alternating spatial regions so the image
 * is usefully distributed (not stuck in one corner).
 *
 * Uses RNG stream `board` only.
 */
export function buildRevealOrder(
  cols: number,
  rows: number,
  rng: SeededRng,
): number[] {
  if (cols < 1 || rows < 1) {
    throw new Error("buildRevealOrder requires positive cols and rows");
  }

  const tileCount = cols * rows;
  const board = rng.stream("board");

  // Region grid: ~3×2 for landscape, ~2×3 portrait, ~2×2 square-ish
  const regionCols = cols >= rows ? 3 : 2;
  const regionRows = rows > cols ? 3 : 2;

  const regions: number[][] = Array.from(
    { length: regionCols * regionRows },
    () => [],
  );

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c;
      const rc = Math.min(
        regionCols - 1,
        Math.floor((c / cols) * regionCols),
      );
      const rr = Math.min(
        regionRows - 1,
        Math.floor((r / rows) * regionRows),
      );
      regions[rr * regionCols + rc]!.push(index);
    }
  }

  // Shuffle each region independently, then interleave round-robin.
  const shuffledRegions = regions.map((region) => board.shuffle(region));
  // Shuffle region visit order so first pick isn't always top-left
  const regionOrder = board.shuffle(
    shuffledRegions.map((_, i) => i).filter((i) => shuffledRegions[i]!.length > 0),
  );

  const order: number[] = [];
  const cursors = new Array(shuffledRegions.length).fill(0);

  while (order.length < tileCount) {
    let progressed = false;
    for (const regionIndex of regionOrder) {
      const region = shuffledRegions[regionIndex]!;
      const cursor = cursors[regionIndex]!;
      if (cursor < region.length) {
        order.push(region[cursor]!);
        cursors[regionIndex] = cursor + 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  // Safety: if anything missing, append remainder in deterministic shuffled order
  if (order.length < tileCount) {
    const seen = new Set(order);
    const missing: number[] = [];
    for (let i = 0; i < tileCount; i += 1) {
      if (!seen.has(i)) missing.push(i);
    }
    order.push(...board.shuffle(missing));
  }

  return order;
}

/**
 * How many tiles should be revealed after `elapsedMs` of active reveal time.
 * Monotonic in elapsed; full at/after durationMs.
 *
 * Tile i (0-based in reveal order) becomes visible when
 * elapsedMs >= (i + 1) * durationMs / tileCount  (exclusive start: 0 revealed at t=0).
 */
export function revealedCountAt(
  elapsedMs: number,
  durationMs: number,
  tileCount: number,
): number {
  if (tileCount <= 0) return 0;
  if (durationMs <= 0) return tileCount;
  if (elapsedMs <= 0) return 0;
  if (elapsedMs >= durationMs) return tileCount;
  // Use floor so the final tile lands exactly at duration
  const count = Math.floor((elapsedMs / durationMs) * tileCount);
  return Math.max(0, Math.min(tileCount, count));
}

/**
 * Elapsed ms at which tile index `orderIndex` (0-based in reveal order) appears.
 */
export function revealTimeForOrderIndex(
  orderIndex: number,
  durationMs: number,
  tileCount: number,
): number {
  if (tileCount <= 0 || orderIndex < 0) return 0;
  if (orderIndex >= tileCount) return durationMs;
  if (durationMs <= 0) return 0;
  return Math.floor(((orderIndex + 1) * durationMs) / tileCount);
}

/** Fraction of tiles still hidden (0–1). */
export function hiddenTileFraction(
  revealedCount: number,
  tileCount: number,
): number {
  if (tileCount <= 0) return 0;
  const hidden = Math.max(0, tileCount - Math.max(0, revealedCount));
  return hidden / tileCount;
}

/**
 * Map logical tile index → CSS grid placement (1-based for CSS grid).
 * Pure; independent of reveal state.
 */
export function tileCssPlacement(
  tileIndex: number,
  cols: number,
): { col: number; row: number } {
  const col = (tileIndex % cols) + 1;
  const row = Math.floor(tileIndex / cols) + 1;
  return { col, row };
}

/**
 * Batch consecutive reveal updates so very short durations don't fire
 * one DOM update per tile every few ms. Returns the next revealed count
 * that should be applied given the previous count and current schedule.
 *
 * Pure helper: callers pass previous + desired; we snap to desired when
 * delta is small enough, or jump by at most `maxBatch` when catching up.
 */
export function batchRevealCount(
  previousCount: number,
  desiredCount: number,
  maxBatch = 8,
): number {
  if (desiredCount <= previousCount) return previousCount;
  const delta = desiredCount - previousCount;
  if (delta <= maxBatch) return desiredCount;
  return previousCount + maxBatch;
}
