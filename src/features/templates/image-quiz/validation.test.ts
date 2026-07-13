import { describe, expect, it } from "vitest";
import { buildImageQuizContent, FIXTURE_IDS } from "@/test/fixtures/builders";
import {
  isImageQuizPlayable,
  validateImageQuizDraft,
  validateImageQuizPlayable,
} from "@/features/templates/image-quiz/validation";
import { imageQuizFixtureSmall } from "@/features/templates/image-quiz/fixtures";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";

describe("image quiz validation", () => {
  it("playable fixture is ok", () => {
    expect(isImageQuizPlayable(imageQuizFixtureSmall.content)).toBe(true);
    expect(validateImageQuizPlayable(imageQuizFixtureSmall.content).ok).toBe(
      true,
    );
  });

  it("requires at least one question", () => {
    const draft = buildImageQuizContent({ questions: [] });
    const issues = validateImageQuizDraft(draft);
    expect(issues.some((i) => i.message === IMAGE_QUIZ_COPY.valMinQuestions)).toBe(
      true,
    );
    expect(isImageQuizPlayable(draft)).toBe(false);
  });

  it("requires reveal image and alt", () => {
    const draft = buildImageQuizContent({
      questions: [
        {
          id: FIXTURE_IDS.imageQuiz.question1,
          prompt: { text: "What?" },
          revealImageAssetId: null,
          revealImageAlt: "",
          answers: [
            { id: FIXTURE_IDS.imageQuiz.answer1, content: { text: "A" } },
            { id: FIXTURE_IDS.imageQuiz.answer2, content: { text: "B" } },
          ],
          correctAnswerId: FIXTURE_IDS.imageQuiz.answer1,
        },
      ],
    });
    const issues = validateImageQuizDraft(draft);
    expect(
      issues.some((i) => i.message === IMAGE_QUIZ_COPY.valRevealRequired),
    ).toBe(true);
    expect(isImageQuizPlayable(draft)).toBe(false);
  });

  it("requires alt when image present", () => {
    const draft = buildImageQuizContent({
      questions: [
        {
          id: FIXTURE_IDS.imageQuiz.question1,
          prompt: { text: "What?" },
          revealImageAssetId: FIXTURE_IDS.imageQuiz.reveal,
          revealImageAlt: "  ",
          answers: [
            { id: FIXTURE_IDS.imageQuiz.answer1, content: { text: "A" } },
            { id: FIXTURE_IDS.imageQuiz.answer2, content: { text: "B" } },
          ],
          correctAnswerId: FIXTURE_IDS.imageQuiz.answer1,
        },
      ],
    });
    const playable = validateImageQuizPlayable(draft);
    expect(playable.ok).toBe(false);
    expect(
      playable.issues.some((i) => i.message === IMAGE_QUIZ_COPY.valRevealAlt),
    ).toBe(true);
  });

  it("requires 2-6 answers and exactly one correct", () => {
    const oneAnswer = buildImageQuizContent({
      questions: [
        {
          id: FIXTURE_IDS.imageQuiz.question1,
          prompt: { text: "What?" },
          revealImageAssetId: FIXTURE_IDS.imageQuiz.reveal,
          revealImageAlt: "Cat",
          answers: [
            { id: FIXTURE_IDS.imageQuiz.answer1, content: { text: "A" } },
          ],
          correctAnswerId: FIXTURE_IDS.imageQuiz.answer1,
        },
      ],
    });
    expect(isImageQuizPlayable(oneAnswer)).toBe(false);

    const noCorrect = buildImageQuizContent({
      questions: [
        {
          id: FIXTURE_IDS.imageQuiz.question1,
          prompt: { text: "What?" },
          revealImageAssetId: FIXTURE_IDS.imageQuiz.reveal,
          revealImageAlt: "Cat",
          answers: [
            { id: FIXTURE_IDS.imageQuiz.answer1, content: { text: "A" } },
            { id: FIXTURE_IDS.imageQuiz.answer2, content: { text: "B" } },
          ],
          correctAnswerId: null,
        },
      ],
    });
    const issues = validateImageQuizDraft(noCorrect);
    expect(
      issues.some((i) => i.message === IMAGE_QUIZ_COPY.valCorrectRequired),
    ).toBe(true);
  });

  it("builder content is playable", () => {
    expect(isImageQuizPlayable(buildImageQuizContent())).toBe(true);
  });
});
