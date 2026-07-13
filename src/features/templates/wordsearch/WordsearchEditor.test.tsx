import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WordsearchContentV1 } from "@/domain/content/wordsearch.v1";
import { WordsearchEditor } from "@/features/templates/wordsearch/editor/WordsearchEditor";
import { WORDSEARCH_LIMITS } from "@/features/templates/wordsearch/validation";
import { wordsearchFixtureMin } from "@/features/templates/wordsearch/fixtures";

function renderEditor(initial?: WordsearchContentV1) {
  let draft =
    initial ??
    ({
      family: "wordsearch",
      version: 1,
      words: [],
    } satisfies WordsearchContentV1);
  const onDraftChange = vi.fn((next: WordsearchContentV1) => {
    draft = next;
  });
  const onDirty = vi.fn();
  const openMediaModal = vi.fn();

  const view = render(
    <WordsearchEditor
      draft={draft}
      onDraftChange={(next) => {
        onDraftChange(next);
        draft = next;
      }}
      validation={[]}
      onDirty={onDirty}
      openMediaModal={openMediaModal}
      limits={{ ...WORDSEARCH_LIMITS }}
    />,
  );

  return { ...view, onDraftChange, onDirty, openMediaModal, getDraft: () => draft };
}

describe("WordsearchEditor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders word rows and add control", () => {
    renderEditor(wordsearchFixtureMin.content);
    expect(screen.getByLabelText(/wordsearch words/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add a word/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2–40 words/i)).toBeInTheDocument();
  });

  it("bulk paste adds one word per line", async () => {
    const user = userEvent.setup();
    const { onDraftChange, onDirty } = renderEditor({
      family: "wordsearch",
      version: 1,
      words: [],
    });

    await user.click(screen.getByRole("button", { name: /bulk paste/i }));
    const area = screen.getByLabelText(/bulk paste/i);
    await user.click(area);
    await user.paste("Alpha\nBeta\nGamma");
    await user.click(screen.getByRole("button", { name: /add lines/i }));

    expect(onDirty).toHaveBeenCalled();
    expect(onDraftChange).toHaveBeenCalled();
    const last = onDraftChange.mock.calls.at(-1)?.[0] as WordsearchContentV1;
    expect(last.words.map((w) => w.displayWord)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(last.words.map((w) => w.normalizedWord)).toEqual([
      "ALPHA",
      "BETA",
      "GAMMA",
    ]);
  });

  it("shows normalized grid preview", () => {
    renderEditor(wordsearchFixtureMin.content);
    expect(screen.getByTestId("wordsearch-normalized-0").textContent).toMatch(
      /CAT/i,
    );
  });
});
