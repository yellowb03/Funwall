import { describe, expect, it } from "vitest";
import {
  allowedDirections,
  calculateMinGridSize,
  generateWordsearch,
  lettersAlongPath,
  prepareWordsForGeneration,
  straightLinePath,
  verifyPlacementsOnGrid,
  WORDSEARCH_MAX_GRID,
} from "@/features/templates/wordsearch/generator";
import {
  wordsearchFixtureMin,
  wordsearchFixtureSmall,
  wordsearchFixtureMedium,
} from "@/features/templates/wordsearch/fixtures";

function entriesFrom(
  fixture: typeof wordsearchFixtureSmall,
): Array<{ id: string; displayWord: string; normalizedWord: string }> {
  return fixture.content.words.map((w) => ({
    id: w.id,
    displayWord: w.displayWord,
    normalizedWord: w.normalizedWord,
  }));
}

describe("wordsearch generator", () => {
  it("is deterministic for the same seed", () => {
    const entries = entriesFrom(wordsearchFixtureSmall);
    const opts = {
      allowDiagonal: false,
      allowReverse: false,
    };
    const a = generateWordsearch(entries, "fw-wordsearch-small-001", opts);
    const b = generateWordsearch(entries, "fw-wordsearch-small-001", opts);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.grid).toEqual(b.grid);
      expect(a.placements).toEqual(b.placements);
      expect(a.rows).toBe(b.rows);
    }
  });

  it("differs across seeds", () => {
    const entries = entriesFrom(wordsearchFixtureSmall);
    const opts = { allowDiagonal: true, allowReverse: true };
    const a = generateWordsearch(entries, "seed-alpha", opts);
    const b = generateWordsearch(entries, "seed-beta", opts);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      // Filler almost certainly differs; placements may too
      expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
    }
  });

  it("places every word at recorded path (small fixture)", () => {
    const result = generateWordsearch(
      entriesFrom(wordsearchFixtureSmall),
      "fw-wordsearch-small-001",
      { allowDiagonal: false, allowReverse: false },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(verifyPlacementsOnGrid(result.grid, result.placements)).toBe(true);
    expect(result.placements).toHaveLength(
      wordsearchFixtureSmall.content.words.length,
    );
    for (const p of result.placements) {
      for (const cell of p.path) {
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(result.rows);
        expect(cell.col).toBeLessThan(result.cols);
      }
    }
  });

  it("places medium fixture with diagonal and reverse", () => {
    const result = generateWordsearch(
      entriesFrom(wordsearchFixtureMedium),
      "fw-wordsearch-medium-001",
      { allowDiagonal: true, allowReverse: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(verifyPlacementsOnGrid(result.grid, result.placements)).toBe(true);
  });

  it("places minimum 2-word pack", () => {
    const result = generateWordsearch(
      entriesFrom(wordsearchFixtureMin),
      "fw-wordsearch-min-001",
      { allowDiagonal: false, allowReverse: false },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(verifyPlacementsOnGrid(result.grid, result.placements)).toBe(true);
    }
  });

  it("rejects duplicate normalized words before placement", () => {
    const result = generateWordsearch(
      [
        { id: "a", displayWord: "RAIN", normalizedWord: "RAIN" },
        { id: "b", displayWord: "rain", normalizedWord: "RAIN" },
      ],
      "dup-seed",
      { allowDiagonal: false, allowReverse: false },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("duplicate");
    }
  });

  it("rejects non-Latin charset", () => {
    const result = generateWordsearch(
      [
        { id: "a", displayWord: "RAIN", normalizedWord: "RAIN" },
        { id: "b", displayWord: "雲", normalizedWord: "雲" },
      ],
      "charset-seed",
      { allowDiagonal: false, allowReverse: false },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("charset");
    }
  });

  it("fails gracefully on impossible long word without hanging", () => {
    const long = "SUPERCALIFRAGILISTIC"; // 19
    const result = generateWordsearch(
      [
        { id: "a", displayWord: long, normalizedWord: long },
        {
          id: "b",
          displayWord: "XY",
          normalizedWord: "XY",
        },
        // Many long-ish unique words to stress placement
        ...Array.from({ length: 12 }, (_, i) => {
          const w = `WORD${String.fromCharCode(65 + i)}LONGXX`;
          return { id: `w${i}`, displayWord: w, normalizedWord: w };
        }),
      ],
      "stress-long",
      {
        allowDiagonal: false,
        allowReverse: false,
        maxGrid: 12,
        maxTotalAttempts: 500,
      },
    );
    // Either succeeds within budget or structured failure — never hang
    if (!result.ok) {
      expect(["placement_failed", "budget", "too_long"]).toContain(
        result.reason,
      );
      expect(result.attemptsUsed).toBeLessThanOrEqual(500);
    } else {
      expect(verifyPlacementsOnGrid(result.grid, result.placements)).toBe(true);
    }
  });

  it("honors horizontal/vertical only when diagonal/reverse off", () => {
    const dirs = allowedDirections(false, false);
    expect(dirs).toEqual([
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
    ]);
  });

  it("includes diagonal and reverse when enabled", () => {
    const dirs = allowedDirections(true, true);
    expect(dirs.length).toBe(8);
  });

  it("filler uses only alphabet letters", () => {
    const result = generateWordsearch(
      entriesFrom(wordsearchFixtureMin),
      "filler-seed",
      {
        allowDiagonal: false,
        allowReverse: false,
        fillerAlphabet: "ABC",
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const placed = new Set(
      result.placements.flatMap((p) =>
        p.path.map((c) => `${c.row},${c.col}`),
      ),
    );
    for (let r = 0; r < result.rows; r += 1) {
      for (let c = 0; c < result.cols; c += 1) {
        const letter = result.grid[r]![c]!;
        if (!placed.has(`${r},${c}`)) {
          expect("ABC").toContain(letter);
        }
      }
    }
  });

  it("property: 100 seeds place all words on path", () => {
    const entries = entriesFrom(wordsearchFixtureSmall);
    let successes = 0;
    for (let i = 0; i < 100; i += 1) {
      const seed = `prop-seed-${i}`;
      const result = generateWordsearch(entries, seed, {
        allowDiagonal: i % 2 === 0,
        allowReverse: i % 3 === 0,
      });
      if (result.ok) {
        successes += 1;
        expect(verifyPlacementsOnGrid(result.grid, result.placements)).toBe(
          true,
        );
        expect(result.rows).toBeLessThanOrEqual(WORDSEARCH_MAX_GRID);
        // Every target word present
        const placed = new Set(result.placements.map((p) => p.normalizedWord));
        for (const e of entries) {
          expect(placed.has(e.normalizedWord)).toBe(true);
        }
      }
    }
    // Expect high success rate for simple farm words
    expect(successes).toBeGreaterThanOrEqual(95);
  });

  it("calculateMinGridSize respects longest word", () => {
    expect(calculateMinGridSize(["HI", "CAT"])).toBeGreaterThanOrEqual(3);
    expect(calculateMinGridSize(["ABCDEFGHIJ"])).toBeGreaterThanOrEqual(10);
  });

  it("straightLinePath rejects bends", () => {
    expect(straightLinePath({ row: 0, col: 0 }, { row: 2, col: 1 })).toBeNull();
    expect(
      straightLinePath({ row: 0, col: 0 }, { row: 2, col: 2 }),
    ).toHaveLength(3);
    expect(
      straightLinePath({ row: 1, col: 0 }, { row: 1, col: 3 }),
    ).toHaveLength(4);
  });

  it("lettersAlongPath reads grid", () => {
    const grid = [
      ["C", "A", "T"],
      ["X", "Y", "Z"],
    ];
    const line = lettersAlongPath(grid, { row: 0, col: 0 }, { row: 0, col: 2 });
    expect(line?.letters).toBe("CAT");
  });

  it("prepareWordsForGeneration fails on empty", () => {
    const r = prepareWordsForGeneration([]);
    expect(r.ok).toBe(false);
  });
});
