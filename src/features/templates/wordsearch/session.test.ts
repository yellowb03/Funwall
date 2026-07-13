import { describe, expect, it } from "vitest";
import { createSeededRng } from "@/services/rng/seeded-rng";
import {
  applyFound,
  applyMiss,
  beginPlaying,
  buildWordsearchResultDetail,
  computeScore,
  createWordsearchSession,
  resolveSelectionLenient,
  unfoundPlacements,
} from "@/features/templates/wordsearch/session";
import {
  wordsearchFixtureMin,
  wordsearchFixtureSmall,
} from "@/features/templates/wordsearch/fixtures";
import { defaultWordsearchSettings } from "@/features/templates/wordsearch/settings";

describe("wordsearch session", () => {
  it("generates board and finds word along solution path", () => {
    const rng = createSeededRng("fw-wordsearch-min-001");
    let state = createWordsearchSession(
      wordsearchFixtureMin.content,
      defaultWordsearchSettings(),
      rng,
    );
    expect(state.board).not.toBeNull();
    state = beginPlaying(state);
    expect(state.phase).toBe("playing");

    const placement = state.board!.placements[0]!;
    const start = placement.path[0]!;
    const end = placement.path[placement.path.length - 1]!;
    const result = resolveSelectionLenient(state, start, end);
    expect(result.kind).toBe("found");
    expect(result.wordId).toBe(placement.wordId);

    state = applyFound(state, result.wordId!, result.path!, 100);
    expect(state.foundOrder).toContain(placement.wordId);
    expect(computeScore(state)).toBe(1);
  });

  it("accepts reverse selection along the same path", () => {
    const rng = createSeededRng("fw-wordsearch-min-001");
    let state = createWordsearchSession(
      wordsearchFixtureMin.content,
      defaultWordsearchSettings(),
      rng,
    );
    state = beginPlaying(state);
    const placement = state.board!.placements[0]!;
    const start = placement.path[placement.path.length - 1]!;
    const end = placement.path[0]!;
    const result = resolveSelectionLenient(state, start, end);
    expect(result.kind).toBe("found");
  });

  it("miss costs a life and can game over", () => {
    const rng = createSeededRng("fw-wordsearch-min-001");
    let state = createWordsearchSession(
      wordsearchFixtureMin.content,
      { ...defaultWordsearchSettings(), lives: 1 },
      rng,
    );
    state = beginPlaying(state);
    // Pick a path that is unlikely to be a word: top-left two cells if not a word
    const start = { row: 0, col: 0 };
    const end = { row: 0, col: 1 };
    const result = resolveSelectionLenient(state, start, end);
    if (result.kind === "found") {
      // try a different short path
      const alt = resolveSelectionLenient(state, { row: 1, col: 0 }, { row: 1, col: 1 });
      if (alt.kind === "miss") {
        state = applyMiss(state, { lives: 1 });
        expect(state.phase).toBe("gameOver");
        expect(state.livesRemaining).toBe(0);
      }
    } else if (result.kind === "miss") {
      state = applyMiss(state, { lives: 1 });
      expect(state.phase).toBe("gameOver");
    }
  });

  it("completes when all words found", () => {
    const rng = createSeededRng(wordsearchFixtureSmall.suggestedSeed);
    let state = createWordsearchSession(
      wordsearchFixtureSmall.content,
      defaultWordsearchSettings(),
      rng,
    );
    state = beginPlaying(state);
    expect(state.board).not.toBeNull();

    for (const p of [...unfoundPlacements(state)]) {
      const start = p.path[0]!;
      const end = p.path[p.path.length - 1]!;
      const result = resolveSelectionLenient(state, start, end);
      expect(result.kind).toBe("found");
      state = applyFound(state, result.wordId!, result.path!, 0);
    }
    expect(state.phase).toBe("completed");
    expect(computeScore(state)).toBe(wordsearchFixtureSmall.content.words.length);

    const detail = buildWordsearchResultDetail(state);
    expect(detail.data.foundCount).toBe(detail.data.totalCount);
    expect(detail.data.missedWordIds).toHaveLength(0);
    expect(detail.data.generatorVersion).toBe(1);
  });
});
