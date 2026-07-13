import { describe, expect, it } from "vitest";
import {
  defaultWordsearchSettings,
  migrateWordsearchSettings,
  wordsearchSettingsSchema,
} from "@/features/templates/wordsearch/settings";

describe("wordsearch settings", () => {
  it("defaults are pure and deterministic", () => {
    expect(defaultWordsearchSettings()).toEqual(defaultWordsearchSettings());
    expect(defaultWordsearchSettings()).toEqual({
      version: 1,
      timerMode: "none",
      lives: null,
      selectionMode: "drag",
      showWordList: true,
      allowDiagonal: false,
      allowReverse: false,
      letterCase: "upper",
      showAnswersAtEnd: true,
      diacriticPolicy: "fold",
    });
  });

  it("validates complete settings", () => {
    expect(
      wordsearchSettingsSchema.safeParse(defaultWordsearchSettings()).success,
    ).toBe(true);
  });

  it("migrates product-fixture keys", () => {
    const migrated = migrateWordsearchSettings(0, {
      version: 1,
      timer: "countDown",
      timerSeconds: 180,
      lives: 3,
      selectionMode: "tapFirst",
      showWordList: false,
      allowDiagonal: true,
      allowReverse: true,
      letterCase: "upper",
      reviewAnswers: true,
      foldDiacritics: false,
    });
    expect(migrated.timerMode).toBe("countDown");
    expect(migrated.timerSeconds).toBe(180);
    expect(migrated.lives).toBe(3);
    expect(migrated.selectionMode).toBe("tapFirst");
    expect(migrated.showAnswersAtEnd).toBe(true);
    expect(migrated.diacriticPolicy).toBe("retain");
  });

  it("migrates invalid raw to defaults", () => {
    expect(migrateWordsearchSettings(0, null)).toEqual(
      defaultWordsearchSettings(),
    );
    expect(migrateWordsearchSettings(0, "nope")).toEqual(
      defaultWordsearchSettings(),
    );
  });

  it("passes through valid v1", () => {
    const raw = {
      version: 1 as const,
      timerMode: "countUp" as const,
      lives: 5,
      selectionMode: "tapAny" as const,
      showWordList: true,
      allowDiagonal: true,
      allowReverse: false,
      letterCase: "lower" as const,
      showAnswersAtEnd: false,
      diacriticPolicy: "fold" as const,
    };
    expect(migrateWordsearchSettings(1, raw)).toMatchObject(raw);
  });
});
