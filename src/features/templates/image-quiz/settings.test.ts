import { describe, expect, it } from "vitest";
import {
  defaultImageQuizSettings,
  migrateImageQuizSettings,
  imageQuizSettingsSchema,
  revealDurationMs,
} from "@/features/templates/image-quiz/settings";

describe("image quiz settings", () => {
  it("defaults are pure and deterministic", () => {
    expect(defaultImageQuizSettings()).toEqual(defaultImageQuizSettings());
    expect(defaultImageQuizSettings()).toEqual({
      version: 1,
      revealDurationSeconds: 30,
      basePoints: 100,
      lives: null,
      shuffleQuestions: false,
      autoProceed: true,
      showAnswers: true,
      layout: "separate",
      tileGrid: null,
    });
  });

  it("validates complete settings", () => {
    const result = imageQuizSettingsSchema.safeParse(defaultImageQuizSettings());
    expect(result.success).toBe(true);
  });

  it("reveal duration default is 30s", () => {
    expect(revealDurationMs(defaultImageQuizSettings())).toBe(30_000);
  });

  it("migrates product-fixture reviewAnswers alias", () => {
    const migrated = migrateImageQuizSettings(0, {
      version: 1,
      revealDurationSeconds: 20,
      basePoints: 100,
      lives: 3,
      shuffleQuestions: false,
      autoProceed: false,
      reviewAnswers: true,
      layout: "together",
    });
    expect(migrated.showAnswers).toBe(true);
    expect(migrated.layout).toBe("together");
    expect(migrated.lives).toBe(3);
    expect(migrated.revealDurationSeconds).toBe(20);
  });

  it("migrates invalid raw to defaults", () => {
    expect(migrateImageQuizSettings(0, null)).toEqual(
      defaultImageQuizSettings(),
    );
    expect(migrateImageQuizSettings(0, "nope")).toEqual(
      defaultImageQuizSettings(),
    );
  });

  it("clamps reveal duration bounds", () => {
    const low = migrateImageQuizSettings(0, { revealDurationSeconds: 1 });
    expect(low.revealDurationSeconds).toBe(5);
    const high = migrateImageQuizSettings(0, { revealDurationSeconds: 999 });
    expect(high.revealDurationSeconds).toBe(120);
  });

  it("passes through valid v1 including tileGrid", () => {
    const raw = {
      version: 1,
      revealDurationSeconds: 15,
      basePoints: 50,
      lives: 2,
      shuffleQuestions: true,
      autoProceed: false,
      showAnswers: false,
      layout: "together" as const,
      tileGrid: { cols: 10, rows: 6 },
    };
    expect(migrateImageQuizSettings(1, raw)).toMatchObject(raw);
  });
});
