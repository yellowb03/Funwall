import { describe, expect, it } from "vitest";
import {
  IMAGE_QUIZ_SCORING_VERSION,
  MAX_ANSWER_SPEED_BONUS,
  MAX_REVEAL_BONUS,
  scoreImageQuizAnswer,
  sumQuestionPoints,
} from "@/features/templates/image-quiz/scoring";

describe("image quiz scoring", () => {
  it("incorrect and unanswered award zero", () => {
    const wrong = scoreImageQuizAnswer({
      isCorrect: false,
      basePoints: 100,
      tilesRevealed: 1,
      tileCount: 96,
      answerElapsedMs: 100,
    });
    expect(wrong.points).toBe(0);
    expect(wrong.baseAwarded).toBe(0);
    expect(wrong.revealBonus).toBe(0);
    expect(wrong.speedBonus).toBe(0);
    expect(wrong.version).toBe(IMAGE_QUIZ_SCORING_VERSION);
  });

  it("early buzz correct gets high reveal bonus", () => {
    const early = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 1,
      tileCount: 100,
      answerElapsedMs: 0,
    });
    expect(early.baseAwarded).toBe(100);
    expect(early.revealBonus).toBe(
      Math.floor(MAX_REVEAL_BONUS * ((100 - 1) / 100)),
    );
    expect(early.speedBonus).toBe(MAX_ANSWER_SPEED_BONUS);
    expect(early.points).toBe(
      early.baseAwarded + early.revealBonus + early.speedBonus,
    );
  });

  it("full reveal (no buzz) has zero reveal bonus", () => {
    const full = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 96,
      tileCount: 96,
      answerElapsedMs: 5000,
    });
    expect(full.revealBonus).toBe(0);
    expect(full.hiddenFraction).toBe(0);
    expect(full.points).toBeGreaterThanOrEqual(100);
  });

  it("middle reveal awards mid reveal bonus", () => {
    const mid = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 48,
      tileCount: 96,
      answerElapsedMs: 1000,
    });
    expect(mid.revealBonus).toBe(Math.floor(MAX_REVEAL_BONUS * 0.5));
  });

  it("slow answers lose speed bonus", () => {
    const slow = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 96,
      tileCount: 96,
      answerElapsedMs: 20_000,
    });
    expect(slow.speedBonus).toBe(0);
    expect(slow.points).toBe(100);
  });

  it("early buzz alone never earns points without correct answer", () => {
    const buzzOnly = scoreImageQuizAnswer({
      isCorrect: false,
      basePoints: 100,
      tilesRevealed: 0,
      tileCount: 96,
      answerElapsedMs: 0,
    });
    expect(buzzOnly.points).toBe(0);
  });

  it("replay sum equals total", () => {
    const a = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 10,
      tileCount: 100,
      answerElapsedMs: 0,
    });
    const b = scoreImageQuizAnswer({
      isCorrect: false,
      basePoints: 100,
      tilesRevealed: 50,
      tileCount: 100,
      answerElapsedMs: 100,
    });
    expect(sumQuestionPoints([a, b])).toBe(a.points);
  });

  it("score table vector is stable", () => {
    const vector = scoreImageQuizAnswer({
      isCorrect: true,
      basePoints: 100,
      tilesRevealed: 25,
      tileCount: 100,
      answerElapsedMs: 3000,
    });
    expect(vector).toEqual({
      version: 1,
      points: vector.points,
      baseAwarded: 100,
      revealBonus: Math.floor(MAX_REVEAL_BONUS * 0.75),
      speedBonus: Math.floor(MAX_ANSWER_SPEED_BONUS * (1 - 3000 / 15_000)),
      hiddenFraction: 0.75,
    });
    expect(vector.points).toBe(
      100 + vector.revealBonus + vector.speedBonus,
    );
  });
});
