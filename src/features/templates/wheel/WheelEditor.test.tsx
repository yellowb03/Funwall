import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ListContentV1 } from "@/domain/content/list.v1";
import { WheelEditor } from "@/features/templates/wheel/editor/WheelEditor";
import { WHEEL_LIMITS } from "@/features/templates/wheel/validation";
import { buildListContent } from "@/test/fixtures/builders";

function renderEditor(initial?: ListContentV1) {
  let draft = initial ?? buildListContent();
  const onDraftChange = vi.fn((next: ListContentV1) => {
    draft = next;
  });
  const onDirty = vi.fn();
  const openMediaModal = vi.fn();

  const rerenderWith = () =>
    render(
      <WheelEditor
        draft={draft}
        onDraftChange={(next) => {
          onDraftChange(next);
          draft = next;
        }}
        validation={[]}
        onDirty={onDirty}
        openMediaModal={openMediaModal}
        limits={{ ...WHEEL_LIMITS }}
      />,
    );

  const view = rerenderWith();
  return { ...view, onDraftChange, onDirty, openMediaModal, getDraft: () => draft };
}

describe("WheelEditor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders item rows and add control", () => {
    renderEditor();
    expect(screen.getByLabelText(/wheel items/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add an item/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2–100 items/i)).toBeInTheDocument();
  });

  it("bulk paste adds one item per line", async () => {
    const user = userEvent.setup();
    const { onDraftChange, onDirty } = renderEditor(
      buildListContent({ items: [] }),
    );

    await user.click(screen.getByRole("button", { name: /bulk paste/i }));
    const area = screen.getByLabelText(/bulk paste/i);
    await user.type(area, "Alpha{Enter}Beta{Enter}Gamma");
    await user.click(screen.getByRole("button", { name: /add lines/i }));

    expect(onDirty).toHaveBeenCalled();
    expect(onDraftChange).toHaveBeenCalled();
    const last = onDraftChange.mock.calls.at(-1)?.[0] as ListContentV1;
    expect(last.items.map((i) => i.content.text)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });
});
