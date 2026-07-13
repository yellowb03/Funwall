import { describe, expect, it } from "vitest";
import {
  foldDiacritics,
  formatLetter,
  normalizeWord,
  resolveNormalizedWord,
} from "@/features/templates/wordsearch/normalize";

describe("wordsearch normalize", () => {
  it("uppercases ASCII words", () => {
    const r = normalizeWord("rain");
    expect(r.ok).toBe(true);
    expect(r.normalizedWord).toBe("RAIN");
    expect(r.displayWord).toBe("rain");
  });

  it("strips spaces and hyphens for placement", () => {
    expect(normalizeWord("ice cream").normalizedWord).toBe("ICECREAM");
    expect(normalizeWord("well-known").normalizedWord).toBe("WELLKNOWN");
    expect(normalizeWord("rock'n'roll").normalizedWord).toBe("ROCKNROLL");
  });

  it("folds diacritics under fold policy", () => {
    const r = normalizeWord("café", { diacriticPolicy: "fold" });
    expect(r.ok).toBe(true);
    expect(r.normalizedWord).toBe("CAFE");
    expect(r.displayWord).toBe("café");
  });

  it("foldDiacritics removes combining marks", () => {
    expect(foldDiacritics("naïve")).toBe("naive");
    expect(foldDiacritics("résumé")).toBe("resume");
  });

  it("rejects empty input", () => {
    const r = normalizeWord("   ");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("empty");
  });

  it("rejects too short after strip", () => {
    const r = normalizeWord("a");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("too_short");
  });

  it("rejects too long", () => {
    const r = normalizeWord("ABCDEFGHIJKLMNOPQRSTU", { maxLength: 20 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("too_long");
  });

  it("rejects non-Latin scripts", () => {
    const r = normalizeWord("雲");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("unsupported_charset");
  });

  it("rejects digits and symbols", () => {
    expect(normalizeWord("C3PO").ok).toBe(false);
    expect(normalizeWord("hello!").ok).toBe(false);
  });

  it("NFKC normalizes compatibility forms", () => {
    // fullwidth Latin letters
    const r = normalizeWord("ｃａｔ");
    expect(r.ok).toBe(true);
    expect(r.normalizedWord).toBe("CAT");
  });

  it("resolveNormalizedWord prefers display recompute", () => {
    const r = resolveNormalizedWord("Snow", "SNOW");
    expect(r.ok).toBe(true);
    expect(r.normalizedWord).toBe("SNOW");
  });

  it("formatLetter respects case setting", () => {
    expect(formatLetter("A", "lower")).toBe("a");
    expect(formatLetter("b", "upper")).toBe("B");
  });
});
