import { describe, expect, it } from "vitest";
import {
  createSeededRng,
  fnv1a32,
  mulberry32,
} from "@/services/rng/seeded-rng";

/**
 * Known vectors — freeze these; changing the algorithm requires ADR-006 update
 * and intentional vector regeneration.
 */
describe("seeded RNG known vectors", () => {
  it("fnv1a32 is stable for fixed inputs", () => {
    expect(fnv1a32("funwall")).toBe(2741029166);
    expect(fnv1a32("")).toBe(0x811c9dc5);
    expect(fnv1a32("test-seed-001")).toBe(fnv1a32("test-seed-001"));
  });

  it("mulberry32 first three floats for seed 1", () => {
    const next = mulberry32(1);
    // Captured once; assert stability across engines.
    const a = next();
    const b = next();
    const c = next();
    expect(a).toBeCloseTo(0.6270739405881613, 12);
    expect(b).toBeCloseTo(0.002735721180215478, 12);
    expect(c).toBeCloseTo(0.5274470399599522, 12);
  });

  it("same seed produces identical stream sequences", () => {
    const a = createSeededRng("classroom-seed-42");
    const b = createSeededRng("classroom-seed-42");

    const streamA = a.stream("contentOrder");
    const streamB = b.stream("contentOrder");

    const seqA = Array.from({ length: 8 }, () => streamA.next());
    const seqB = Array.from({ length: 8 }, () => streamB.next());
    expect(seqA).toEqual(seqB);
  });

  it("named streams are independent for the same master seed", () => {
    const rng = createSeededRng("classroom-seed-42");
    const content = rng.stream("contentOrder").next();
    const board = rng.stream("board").next();
    const bonus = rng.stream("bonus").next();
    const visual = rng.stream("visual").next();

    // Different stream names must not share the first value in general.
    const unique = new Set([content, board, bonus, visual]);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("known contentOrder first five floats for fixed seed", () => {
    const rng = createSeededRng("funwall-vector-v1");
    const stream = rng.stream("contentOrder");
    const values = Array.from({ length: 5 }, () => stream.next());
    expect(values).toEqual([
      0.08201052318327129,
      0.1846387500409037,
      0.50645646546036,
      0.6001941461581737,
      0.9254049139562994,
    ]);
  });

  it("shuffle is deterministic for a seed", () => {
    const rng = createSeededRng("shuffle-seed");
    expect(rng.stream("board").shuffle(["a", "b", "c", "d"])).toEqual(
      createSeededRng("shuffle-seed").stream("board").shuffle(["a", "b", "c", "d"]),
    );
  });

  it("int is inclusive and stable", () => {
    const a = createSeededRng("int-seed");
    const b = createSeededRng("int-seed");
    const valuesA = Array.from({ length: 20 }, () => a.stream("bonus").int(1, 6));
    const valuesB = Array.from({ length: 20 }, () => b.stream("bonus").int(1, 6));
    expect(valuesA.every((v) => v >= 1 && v <= 6)).toBe(true);
    expect(valuesA).toEqual(valuesB);
  });
});
