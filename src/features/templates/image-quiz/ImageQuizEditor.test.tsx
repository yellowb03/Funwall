import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImageQuizContentV1 } from "@/domain/content/imageQuiz.v1";
import { ImageQuizEditor } from "@/features/templates/image-quiz/editor/ImageQuizEditor";
import { IMAGE_QUIZ_LIMITS } from "@/features/templates/image-quiz/validation";
import { buildImageQuizContent } from "@/test/fixtures/builders";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";

function renderEditor(
  initial?: ImageQuizContentV1,
  validation: Array<{
    path: Array<string | number>;
    message: string;
    severity: "error" | "warning";
  }> = [],
) {
  let draft = initial ?? buildImageQuizContent();
  const onDraftChange = vi.fn((next: ImageQuizContentV1) => {
    draft = next;
  });
  const onDirty = vi.fn();
  const openMediaModal = vi.fn();

  const view = render(
    <ImageQuizEditor
      draft={draft}
      onDraftChange={(next) => {
        onDraftChange(next);
        draft = next;
      }}
      validation={validation}
      onDirty={onDirty}
      openMediaModal={openMediaModal}
      limits={{ ...IMAGE_QUIZ_LIMITS }}
    />,
  );

  return { ...view, onDraftChange, onDirty, openMediaModal, getDraft: () => draft };
}

describe("ImageQuizEditor", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders questions and add control", () => {
    renderEditor();
    expect(screen.getByLabelText(/image quiz questions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add a question/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1–100 questions/i)).toBeInTheDocument();
  });

  it("opens media modal for missing reveal image", async () => {
    const user = userEvent.setup();
    const empty = buildImageQuizContent({
      questions: [
        {
          id: "55555555-5555-4555-8555-555555555551",
          prompt: { text: "What?" },
          revealImageAssetId: null,
          revealImageAlt: "",
          answers: [
            {
              id: "55555555-5555-4555-8555-5555555555a1",
              content: { text: "A" },
            },
            {
              id: "55555555-5555-4555-8555-5555555555a2",
              content: { text: "B" },
            },
          ],
          correctAnswerId: "55555555-5555-4555-8555-5555555555a1",
        },
      ],
    });
    const { openMediaModal } = renderEditor(empty, [
      {
        path: ["questions", 0, "revealImageAssetId"],
        message: IMAGE_QUIZ_COPY.valRevealRequired,
        severity: "error",
      },
    ]);

    expect(
      screen.getByTestId("image-quiz-reveal-error-0"),
    ).toHaveTextContent(IMAGE_QUIZ_COPY.valRevealRequired);

    await user.click(screen.getByTestId("image-quiz-choose-reveal-0"));
    expect(openMediaModal).toHaveBeenCalledWith({
      kind: "question",
      questionId: "55555555-5555-4555-8555-555555555551",
      channel: "revealImage",
    });
  });

  it("adds a question", async () => {
    const user = userEvent.setup();
    const { onDraftChange, onDirty } = renderEditor(
      buildImageQuizContent({ questions: [] }),
    );
    await user.click(screen.getByTestId("image-quiz-add-question"));
    expect(onDirty).toHaveBeenCalled();
    expect(onDraftChange).toHaveBeenCalled();
    const last = onDraftChange.mock.calls.at(-1)?.[0] as ImageQuizContentV1;
    expect(last.questions).toHaveLength(1);
    expect(last.questions[0]!.answers.length).toBeGreaterThanOrEqual(2);
  });

  it("marks correct answer via radio", async () => {
    const user = userEvent.setup();
    const { onDraftChange } = renderEditor();
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThanOrEqual(2);
    // Default correct is answer index 1; switch to index 0
    await user.click(radios[0]!);
    expect(onDraftChange).toHaveBeenCalled();
    const last = onDraftChange.mock.calls.at(-1)?.[0] as ImageQuizContentV1;
    expect(last.questions[0]!.correctAnswerId).toBe(
      last.questions[0]!.answers[0]!.id,
    );
  });
});
