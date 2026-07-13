import { describe, expect, it } from "vitest";
import { createSeededRng } from "@/services/rng/seeded-rng";
import {
  batchRevealCount,
  buildRevealOrder,
  computeTileGrid,
  DEFAULT_LANDSCAPE_COLS,
  DEFAULT_LANDSCAPE_ROWS,
  hiddenTileFraction,
  MAX_TILE_COUNT,
  MIN_TILE_COUNT,
  revealedCountAt,
  revealTimeForOrderIndex,
  tileCssPlacement,
} from "@/features/templates/image-quiz/reveal";

describe("image quiz reveal algorithm", () => {
  it("defaults landscape grid near 12x8", () => {
    const grid = computeTileGrid({ aspectRatio: 3 / 2 });
    expect(grid.cols).toBeGreaterThanOrEqual(DEFAULT_LANDSCAPE_COLS - 2);
    expect(grid.rows).toBeGreaterThanOrEqual(DEFAULT_LANDSCAPE_ROWS - 2);
    expect(grid.cols * grid.rows).toBeGreaterThanOrEqual(MIN_TILE_COUNT);
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(MAX_TILE_COUNT);
  });

  it("adapts portrait and square aspects", () => {
    const portrait = computeTileGrid({ aspectRatio: 0.6 });
    const square = computeTileGrid({ aspectRatio: 1 });
    const landscape = computeTileGrid({ aspectRatio: 1.8 });
    expect(portrait.rows).toBeGreaterThanOrEqual(portrait.cols);
    expect(Math.abs(square.cols - square.rows)).toBeLessThanOrEqual(2);
    expect(landscape.cols).toBeGreaterThanOrEqual(landscape.rows);
  });

  it("honors explicit tile grid override", () => {
    expect(computeTileGrid({ override: { cols: 6, rows: 4 } })).toEqual({
      cols: 6,
      rows: 4,
    });
  });

  it("same seed yields identical reveal order", () => {
    const cols = 12;
    const rows = 8;
    const a = buildRevealOrder(cols, rows, createSeededRng("fw-image-quiz-small-001"));
    const b = buildRevealOrder(cols, rows, createSeededRng("fw-image-quiz-small-001"));
    expect(a).toEqual(b);
    expect(a).toHaveLength(cols * rows);
    expect(new Set(a).size).toBe(cols * rows);
  });

  it("different seeds produce different orders (almost always)", () => {
    const cols = 10;
    const rows = 8;
    const a = buildRevealOrder(cols, rows, createSeededRng("seed-a"));
    const b = buildRevealOrder(cols, rows, createSeededRng("seed-b"));
    expect(a).not.toEqual(b);
  });

  it("known seed vector is stable", () => {
    const order = buildRevealOrder(
      4,
      3,
      createSeededRng("funwall-image-quiz-vector-v1"),
    );
    expect(order).toEqual(
      buildRevealOrder(4, 3, createSeededRng("funwall-image-quiz-vector-v1")),
    );
    // Full permutation must cover 0..11 exactly once
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i),
    );
  });

  it("early reveals are spatially distributed across regions", () => {
    const cols = 12;
    const rows = 8;
    const order = buildRevealOrder(
      cols,
      rows,
      createSeededRng("distribution-seed"),
    );
    const early = order.slice(0, 12);
    // Map to quadrants
    const quads = new Set(
      early.map((idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const qx = c < cols / 2 ? 0 : 1;
        const qy = r < rows / 2 ? 0 : 1;
        return qx + qy * 2;
      }),
    );
    // At least 3 of 4 quadrants represented in first 12
    expect(quads.size).toBeGreaterThanOrEqual(3);
  });

  it("revealedCountAt is monotonic and bounds-safe", () => {
    const tileCount = 96;
    const duration = 30_000;
    expect(revealedCountAt(0, duration, tileCount)).toBe(0);
    expect(revealedCountAt(-1, duration, tileCount)).toBe(0);
    expect(revealedCountAt(duration, duration, tileCount)).toBe(tileCount);
    expect(revealedCountAt(duration + 1000, duration, tileCount)).toBe(
      tileCount,
    );

    let prev = 0;
    for (let t = 0; t <= duration; t += 100) {
      const c = revealedCountAt(t, duration, tileCount);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });

  it("fake-clock schedule hits middle and final boundary", () => {
    const tileCount = 10;
    const duration = 10_000;
    expect(revealedCountAt(0, duration, tileCount)).toBe(0);
    expect(revealedCountAt(1000, duration, tileCount)).toBe(1);
    expect(revealedCountAt(5000, duration, tileCount)).toBe(5);
    expect(revealedCountAt(9999, duration, tileCount)).toBe(9);
    expect(revealedCountAt(10_000, duration, tileCount)).toBe(10);
  });

  it("revealTimeForOrderIndex aligns with revealedCountAt", () => {
    const tileCount = 20;
    const duration = 20_000;
    for (let i = 0; i < tileCount; i += 1) {
      const t = revealTimeForOrderIndex(i, duration, tileCount);
      expect(revealedCountAt(t, duration, tileCount)).toBeGreaterThanOrEqual(
        i + 1,
      );
      if (t > 0) {
        expect(revealedCountAt(t - 1, duration, tileCount)).toBeLessThanOrEqual(
          i + 1,
        );
      }
    }
  });

  it("hidden fraction is correct", () => {
    expect(hiddenTileFraction(0, 100)).toBe(1);
    expect(hiddenTileFraction(50, 100)).toBe(0.5);
    expect(hiddenTileFraction(100, 100)).toBe(0);
  });

  it("batchRevealCount rate-limits jumps", () => {
    expect(batchRevealCount(0, 3, 8)).toBe(3);
    expect(batchRevealCount(0, 20, 8)).toBe(8);
    expect(batchRevealCount(10, 10, 8)).toBe(10);
  });

  it("tileCssPlacement is stable under resize concepts", () => {
    expect(tileCssPlacement(0, 12)).toEqual({ col: 1, row: 1 });
    expect(tileCssPlacement(11, 12)).toEqual({ col: 12, row: 1 });
    expect(tileCssPlacement(12, 12)).toEqual({ col: 1, row: 2 });
  });
});
