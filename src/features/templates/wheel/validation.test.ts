import { describe, expect, it } from "vitest";
import { buildListContent, FIXTURE_IDS } from "@/test/fixtures/builders";
import {
  isWheelPlayable,
  validateWheelDraft,
  validateWheelPlayable,
} from "@/features/templates/wheel/validation";

describe("wheel content validation", () => {
  it("accepts playable list with 2+ meaningful items", () => {
    const pack = buildListContent();
    expect(isWheelPlayable(pack)).toBe(true);
    expect(validateWheelPlayable(pack).ok).toBe(true);
  });

  it("rejects playable validation with fewer than 2 non-empty items", () => {
    const pack = buildListContent({
      items: [
        { id: FIXTURE_IDS.list.item1, content: { text: "Only one" } },
        { id: FIXTURE_IDS.list.item2, content: { text: "  " } },
      ],
    });
    const result = validateWheelPlayable(pack);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => /at least 2/i.test(i.message))).toBe(
      true,
    );
  });

  it("rejects empty draft as not playable but allows draft schema shape", () => {
    const pack = buildListContent({ items: [] });
    expect(isWheelPlayable(pack)).toBe(false);
    const draftIssues = validateWheelDraft(pack);
    expect(draftIssues.some((i) => i.severity === "error")).toBe(true);
  });

  it("warns when more than 30 items", () => {
    const items = Array.from({ length: 31 }, (_, i) => ({
      id: `aaaaaaaa-bbbb-4ccc-8ddd-${(i + 1).toString(16).padStart(12, "0")}`,
      content: { text: `Item ${i + 1}` },
    }));
    const pack = buildListContent({ items });
    const issues = validateWheelDraft(pack);
    expect(issues.some((i) => i.severity === "warning" && /30/.test(i.message))).toBe(
      true,
    );
  });
});
