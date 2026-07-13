import { describe, expect, it } from "vitest";
import {
  isWordsearchPlayable,
  validateWordsearchDraft,
  validateWordsearchPlayable,
} from "@/features/templates/wordsearch/validation";
import {
  wordsearchFixtureMin,
  wordsearchFixtureSmall,
} from "@/features/templates/wordsearch/fixtures";

describe("wordsearch validation", () => {
  it("accepts playable small fixture", () => {
    expect(isWordsearchPlayable(wordsearchFixtureSmall.content)).toBe(true);
    expect(validateWordsearchPlayable(wordsearchFixtureSmall.content).ok).toBe(
      true,
    );
  });

  it("draft with empty words surfaces min error", () => {
    const issues = validateWordsearchDraft({
      family: "wordsearch",
      version: 1,
      words: [],
    });
    expect(issues.some((i) => i.message.includes("at least 2"))).toBe(true);
  });

  it("rejects duplicate normalized words", () => {
    const issues = validateWordsearchDraft({
      family: "wordsearch",
      version: 1,
      words: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          displayWord: "RAIN",
          normalizedWord: "RAIN",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          displayWord: "rain",
          normalizedWord: "RAIN",
        },
      ],
    });
    expect(issues.some((i) => /matches another word/i.test(i.message))).toBe(
      true,
    );
  });

  it("rejects unsupported charset", () => {
    const issues = validateWordsearchDraft({
      family: "wordsearch",
      version: 1,
      words: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          displayWord: "RAIN",
          normalizedWord: "RAIN",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          displayWord: "雲",
          normalizedWord: "雲",
        },
      ],
    });
    expect(issues.some((i) => /cannot use/i.test(i.message))).toBe(true);
  });

  it("playable rejects single word", () => {
    const result = validateWordsearchPlayable({
      family: "wordsearch",
      version: 1,
      words: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          displayWord: "CAT",
          normalizedWord: "CAT",
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("min fixture is playable", () => {
    expect(isWordsearchPlayable(wordsearchFixtureMin.content)).toBe(true);
  });
});
