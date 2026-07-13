import { describe, expect, it } from "vitest";
import { buildStatementsContent, FIXTURE_IDS } from "@/test/fixtures/builders";
import {
  computeImbalance,
  isTrueFalsePlayable,
  validateTrueFalseDraft,
  validateTrueFalsePlayable,
} from "@/features/templates/true-false/validation";
import { trueFalseFixtureSmall } from "@/features/templates/true-false/fixtures";
import { parseBulkPaste } from "@/features/templates/true-false/bulk-paste";

describe("true-false content validation", () => {
  it("accepts playable statements with 2+ explicit booleans", () => {
    const pack = buildStatementsContent();
    expect(isTrueFalsePlayable(pack)).toBe(true);
    expect(validateTrueFalsePlayable(pack).ok).toBe(true);
  });

  it("accepts small fixture", () => {
    expect(isTrueFalsePlayable(trueFalseFixtureSmall.content)).toBe(true);
  });

  it("rejects playable with fewer than 2 complete statements", () => {
    const pack = buildStatementsContent({
      statements: [
        {
          id: FIXTURE_IDS.statements.s1,
          content: { text: "Only one" },
          isTrue: true,
        },
      ],
    });
    const result = validateTrueFalsePlayable(pack);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /at least 2/i.test(i.message))).toBe(
      true,
    );
  });

  it("rejects statements missing isTrue for playable", () => {
    const pack = buildStatementsContent({
      statements: [
        {
          id: FIXTURE_IDS.statements.s1,
          content: { text: "A" },
          isTrue: null,
        },
        {
          id: FIXTURE_IDS.statements.s2,
          content: { text: "B" },
          isTrue: true,
        },
      ],
    });
    expect(isTrueFalsePlayable(pack)).toBe(false);
    const draftIssues = validateTrueFalseDraft(pack);
    expect(
      draftIssues.some(
        (i) =>
          i.path.includes("isTrue") || /true or false/i.test(i.message),
      ),
    ).toBe(true);
  });

  it("warns on imbalance without blocking playable", () => {
    const statements = Array.from({ length: 5 }, (_, i) => ({
      id: `66666666-6666-4666-8666-${(i + 1).toString(16).padStart(12, "0")}`,
      content: { text: `True fact ${i + 1}` },
      isTrue: true as boolean | null,
    }));
    statements[4] = {
      ...statements[4]!,
      content: { text: "False fact" },
      isTrue: false,
    };
    const pack = buildStatementsContent({ statements });
    expect(isTrueFalsePlayable(pack)).toBe(true);
    const imbalance = computeImbalance(pack.statements);
    expect(imbalance?.dominant).toBe("true");
    const issues = validateTrueFalseDraft(pack);
    expect(
      issues.some(
        (i) => i.severity === "warning" && /mostly true/i.test(i.message),
      ),
    ).toBe(true);
  });

  it("rejects empty draft as not playable", () => {
    const pack = buildStatementsContent({ statements: [] });
    expect(isTrueFalsePlayable(pack)).toBe(false);
    const draftIssues = validateTrueFalseDraft(pack);
    expect(draftIssues.some((i) => i.severity === "error")).toBe(true);
  });
});

describe("bulk paste markers", () => {
  it("parses [T]/[F] and defaults", () => {
    const lines = parseBulkPaste(
      "Earth orbits the Sun [T]\nThe Moon is a star [F]\nDefault true line\n[true]\nBad only marker [F]",
    );
    expect(lines).toEqual([
      { text: "Earth orbits the Sun", isTrue: true },
      { text: "The Moon is a star", isTrue: false },
      { text: "Default true line", isTrue: true },
      // lone marker without text is skipped; last line has text before marker
      { text: "Bad only marker", isTrue: false },
    ]);
  });
});
