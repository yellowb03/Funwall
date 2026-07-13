import { describe, expect, it } from "vitest";
import {
  answerWindowMs,
  answerWindowTable,
  defaultTrueFalseSettings,
  migrateTrueFalseSettings,
  trueFalseSettingsSchema,
  ANSWER_WINDOW_MIN_MS,
  ANSWER_WINDOW_MAX_MS,
} from "@/features/templates/true-false/settings";

describe("true-false settings", () => {
  it("defaults are pure and deterministic", () => {
    expect(defaultTrueFalseSettings()).toEqual(defaultTrueFalseSettings());
    expect(defaultTrueFalseSettings()).toEqual({
      version: 1,
      timerMode: "none",
      speed: 5,
      lives: null,
      repeatUntilTime: false,
      showAnswers: true,
      shuffle: false,
    });
  });

  it("validates complete settings", () => {
    const result = trueFalseSettingsSchema.safeParse(defaultTrueFalseSettings());
    expect(result.success).toBe(true);
  });

  it("speed-to-window table is bounded and monotonic decreasing", () => {
    const table = answerWindowTable();
    expect(Object.keys(table)).toHaveLength(10);
    expect(table[5]).toBe(3500);
    expect(table[1]).toBeGreaterThan(table[5]!);
    expect(table[10]).toBeLessThan(table[5]!);
    for (let s = 1; s <= 10; s += 1) {
      expect(table[s]).toBeGreaterThanOrEqual(ANSWER_WINDOW_MIN_MS);
      expect(table[s]).toBeLessThanOrEqual(ANSWER_WINDOW_MAX_MS);
    }
    for (let s = 1; s < 10; s += 1) {
      expect(table[s]!).toBeGreaterThanOrEqual(table[s + 1]!);
    }
  });

  it("clamps out-of-range speed", () => {
    expect(answerWindowMs(0)).toBe(answerWindowMs(1));
    expect(answerWindowMs(99)).toBe(answerWindowMs(10));
  });

  it("migrates provisional product-fixture keys", () => {
    const migrated = migrateTrueFalseSettings(0, {
      version: 1,
      timer: "countDown",
      timerSeconds: 45,
      speed: 8,
      lives: 2,
      repeatUntilTime: true,
      reviewAnswers: true,
    });
    expect(migrated.timerMode).toBe("countDown");
    expect(migrated.timerSeconds).toBe(45);
    expect(migrated.speed).toBe(8);
    expect(migrated.lives).toBe(2);
    expect(migrated.repeatUntilTime).toBe(true);
    expect(migrated.showAnswers).toBe(true);
  });

  it("migrates invalid raw to defaults", () => {
    expect(migrateTrueFalseSettings(0, null)).toEqual(
      defaultTrueFalseSettings(),
    );
    expect(migrateTrueFalseSettings(0, "nope")).toEqual(
      defaultTrueFalseSettings(),
    );
  });

  it("maps unlimited lives aliases", () => {
    expect(migrateTrueFalseSettings(0, { lives: "unlimited" }).lives).toBe(
      null,
    );
    expect(migrateTrueFalseSettings(0, { lives: 0 }).lives).toBe(null);
    expect(migrateTrueFalseSettings(0, { lives: null }).lives).toBe(null);
  });

  it("passes through valid v1", () => {
    const raw = {
      version: 1,
      timerMode: "countUp",
      speed: 4,
      lives: 3,
      repeatUntilTime: false,
      showAnswers: true,
      shuffle: true,
    };
    expect(migrateTrueFalseSettings(1, raw)).toMatchObject(raw);
  });
});
