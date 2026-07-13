import { describe, expect, it } from "vitest";
import { createSeededRng } from "@/services/rng/seeded-rng";
import { buildImageQuizContent } from "@/test/fixtures/builders";
import {
  imageQuizFixtureSmall,
  imageQuizFixtureMedium,
} from "@/features/templates/image-quiz/fixtures";
import { defaultImageQuizSettings } from "@/features/templates/image-quiz/settings";
import { revealedCountAt } from "@/features/templates/image-quiz/reveal";
import {
  advanceAfterFeedback,
  applyBuzz,
  beginLoadingImage,
  buildImageQuizResultDetail,
  canAnswer,
  canBuzz,
  createImageQuizSession,
  currentQuestion,
  markImageReady,
  openAnswering,
  submitAnswer,
  tickReveal,
} from "@/features/templates/image-quiz/session";

describe("image quiz session", () => {
  it("creates intro session with deterministic reveal order", () => {
    const settings = defaultImageQuizSettings();
    const a = createImageQuizSession(
      imageQuizFixtureSmall.content,
      settings,
      createSeededRng("fw-image-quiz-small-001"),
    );
    const b = createImageQuizSession(
      imageQuizFixtureSmall.content,
      settings,
      createSeededRng("fw-image-quiz-small-001"),
    );
    expect(a.revealOrder).toEqual(b.revealOrder);
    expect(a.phase).toBe("intro");
    expect(a.questionOrder).toHaveLength(2);
  });

  it("shuffles questions with contentOrder stream when enabled", () => {
    const settings = {
      ...defaultImageQuizSettings(),
      shuffleQuestions: true,
    };
    const s1 = createImageQuizSession(
      imageQuizFixtureMedium.content,
      settings,
      createSeededRng("shuffle-seed-1"),
    );
    const s2 = createImageQuizSession(
      imageQuizFixtureMedium.content,
      settings,
      createSeededRng("shuffle-seed-1"),
    );
    expect(s1.questionOrder).toEqual(s2.questionOrder);
  });

  it("buzz locks once and freezes reveal progress", () => {
    const settings = defaultImageQuizSettings();
    let state = createImageQuizSession(
      buildImageQuizContent(),
      settings,
      createSeededRng("buzz-lock"),
    );
    state = beginLoadingImage({ ...state, phase: "intro" });
    state = markImageReady(state);
    expect(state.phase).toBe("revealing");
    expect(canBuzz(state)).toBe(true);

    const duration = settings.revealDurationSeconds * 1000;
    state = tickReveal(state, 5_000, duration);
    const revealedAtBuzz = state.revealedCount;
    expect(revealedAtBuzz).toBeGreaterThan(0);

    state = applyBuzz(state, 5_000, duration);
    expect(state.buzzed).toBe(true);
    expect(state.revealedCount).toBe(revealedAtBuzz);

    const again = applyBuzz(state, 8_000, duration);
    expect(again.revealedCount).toBe(revealedAtBuzz);
    expect(again.phase).toBe("buzzed");

    state = openAnswering(state);
    expect(state.phase).toBe("answering");
    expect(canAnswer(state)).toBe(true);
    expect(canBuzz(state)).toBe(false);
  });

  it("buzz at first tile, middle, final boundary, and after completion", () => {
    const settings = {
      ...defaultImageQuizSettings(),
      revealDurationSeconds: 10,
    };
    const duration = 10_000;

    const runAt = (elapsed: number) => {
      let state = createImageQuizSession(
        buildImageQuizContent(),
        settings,
        createSeededRng("boundary-seed"),
      );
      state = markImageReady({
        ...state,
        phase: "loadingImage",
      });
      const expected = revealedCountAt(
        elapsed,
        duration,
        state.revealOrder.length,
      );
      state = tickReveal(state, elapsed, duration);
      if (state.phase === "answering") {
        // full reveal path
        expect(state.revealedCount).toBe(state.revealOrder.length);
        expect(state.buzzed).toBe(false);
        return state;
      }
      state = applyBuzz(state, elapsed, duration);
      expect(state.revealedCount).toBe(expected);
      return state;
    };

    const first = runAt(1);
    // may be 0 or 1 depending on schedule; ensure buzz accepted or still revealing
    expect(first.buzzed || first.phase === "answering").toBe(true);

    const mid = runAt(5_000);
    expect(mid.buzzed).toBe(true);
    expect(mid.revealedCount).toBeGreaterThan(0);
    expect(mid.revealedCount).toBeLessThan(mid.revealOrder.length);

    const end = runAt(10_000);
    expect(end.phase).toBe("answering");
    expect(end.revealedCount).toBe(end.revealOrder.length);
  });

  it("scoring stores reveal progress in result detail", () => {
    const settings = defaultImageQuizSettings();
    let state = createImageQuizSession(
      buildImageQuizContent(),
      settings,
      createSeededRng("score-detail"),
    );
    state = markImageReady({ ...state, phase: "loadingImage" });
    const duration = 30_000;
    state = tickReveal(state, 3_000, duration);
    state = openAnswering(applyBuzz(state, 3_000, duration));
    const q = currentQuestion(state)!;
    state = submitAnswer(state, settings, q.correctAnswerId!, 500);

    expect(state.phase).toBe("feedback");
    expect(state.results).toHaveLength(1);
    expect(state.results[0]!.tilesRevealedAtBuzz).toBeGreaterThanOrEqual(0);
    expect(state.results[0]!.buzzed).toBe(true);
    expect(state.results[0]!.points).toBeGreaterThan(0);
    expect(state.score).toBe(state.results[0]!.points);

    const detail = buildImageQuizResultDetail(state);
    expect(detail.version).toBe(1);
    expect(detail.data.results[0]!.tilesRevealedAtBuzz).toBe(
      state.results[0]!.tilesRevealedAtBuzz,
    );
  });

  it("wrong answer costs a life and can game over", () => {
    const settings = {
      ...defaultImageQuizSettings(),
      lives: 1,
      autoProceed: false,
      showAnswers: false,
    };
    let state = createImageQuizSession(
      buildImageQuizContent(),
      settings,
      createSeededRng("lives-seed"),
    );
    state = markImageReady({ ...state, phase: "loadingImage" });
    state = openAnswering(
      applyBuzz(state, 100, settings.revealDurationSeconds * 1000),
    );
    const q = currentQuestion(state)!;
    const wrong = q.answers.find((a) => a.id !== q.correctAnswerId)!.id;
    state = submitAnswer(state, settings, wrong, 100);
    expect(state.livesRemaining).toBe(0);
    expect(state.results[0]!.points).toBe(0);

    state = advanceAfterFeedback(
      state,
      settings,
      createSeededRng("lives-seed"),
    );
    expect(state.phase).toBe("gameOver");
  });

  it("layout setting does not change scoring state", () => {
    const base = defaultImageQuizSettings();
    const separate = createImageQuizSession(
      buildImageQuizContent(),
      { ...base, layout: "separate" },
      createSeededRng("layout-seed"),
    );
    const together = createImageQuizSession(
      buildImageQuizContent(),
      { ...base, layout: "together" },
      createSeededRng("layout-seed"),
    );
    expect(separate.revealOrder).toEqual(together.revealOrder);
    expect(separate.answersVisible).toBe(false);
    expect(together.answersVisible).toBe(true);
  });

  it("tick after buzz does not leak extra tiles", () => {
    const settings = defaultImageQuizSettings();
    const duration = 30_000;
    let state = createImageQuizSession(
      buildImageQuizContent(),
      settings,
      createSeededRng("no-leak"),
    );
    state = markImageReady({ ...state, phase: "loadingImage" });
    state = applyBuzz(state, 2_000, duration);
    const frozen = state.revealedCount;
    const after = tickReveal(state, 20_000, duration);
    expect(after.revealedCount).toBe(frozen);
    expect(after.phase).toBe("buzzed");
  });
});
