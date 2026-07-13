import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrueFalseEditor } from "@/features/templates/true-false/editor/TrueFalseEditor";
import type { StatementsContentV1 } from "@/domain/content/statements.v1";
import { TRUE_FALSE_LIMITS } from "@/features/templates/true-false/validation";

function emptyDraft(): StatementsContentV1 {
  return { family: "statements", version: 1, statements: [] };
}

describe("TrueFalseEditor", () => {
  it("adds a statement and toggles truth", async () => {
    const user = userEvent.setup();
    let draft = emptyDraft();
    const onDraftChange = vi.fn((next: StatementsContentV1) => {
      draft = next;
    });
    const onDirty = vi.fn();

    const { rerender } = render(
      <TrueFalseEditor
        draft={draft}
        onDraftChange={onDraftChange}
        onDirty={onDirty}
        openMediaModal={vi.fn()}
        validation={[]}
        limits={TRUE_FALSE_LIMITS}
      />,
    );

    await user.click(screen.getByTestId("tf-add-statement"));
    expect(onDraftChange).toHaveBeenCalled();
    draft = onDraftChange.mock.calls.at(-1)![0] as StatementsContentV1;
    expect(draft.statements).toHaveLength(1);

    rerender(
      <TrueFalseEditor
        draft={draft}
        onDraftChange={onDraftChange}
        onDirty={onDirty}
        openMediaModal={vi.fn()}
        validation={[]}
        limits={TRUE_FALSE_LIMITS}
      />,
    );

    await user.click(screen.getByTestId("tf-truth-false-0"));
    draft = onDraftChange.mock.calls.at(-1)![0] as StatementsContentV1;
    expect(draft.statements[0]!.isTrue).toBe(false);
    expect(onDirty).toHaveBeenCalled();
  });

  it("bulk pastes lines with truth markers", async () => {
    const user = userEvent.setup();
    let draft = emptyDraft();
    const onDraftChange = vi.fn((next: StatementsContentV1) => {
      draft = next;
    });

    const { rerender } = render(
      <TrueFalseEditor
        draft={draft}
        onDraftChange={onDraftChange}
        onDirty={vi.fn()}
        openMediaModal={vi.fn()}
        validation={[]}
        limits={TRUE_FALSE_LIMITS}
      />,
    );

    await user.click(screen.getByTestId("tf-bulk-toggle"));
    fireEvent.change(screen.getByTestId("tf-bulk-textarea"), {
      target: { value: "Alpha [T]\nBeta [F]" },
    });
    await user.click(screen.getByTestId("tf-bulk-apply"));

    draft = onDraftChange.mock.calls.at(-1)![0] as StatementsContentV1;
    expect(draft.statements.length).toBeGreaterThanOrEqual(2);
    expect(draft.statements[0]!.isTrue).toBe(true);
    expect(draft.statements[1]!.isTrue).toBe(false);

    rerender(
      <TrueFalseEditor
        draft={draft}
        onDraftChange={onDraftChange}
        onDirty={vi.fn()}
        openMediaModal={vi.fn()}
        validation={[]}
        limits={TRUE_FALSE_LIMITS}
      />,
    );
    expect(screen.getByTestId("tf-statement-list").children.length).toBe(
      draft.statements.length,
    );
  });
});
