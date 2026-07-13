"use client";

import { useCallback, useId, type ReactElement } from "react";
import type {
  ImageQuizContentV1,
  ImageQuizQuestion,
} from "@/domain/content/imageQuiz.v1";
import type { QuizAnswer } from "@/domain/content/quiz.v1";
import type { RichContent } from "@/domain/rich-content";
import type { EditorAdapterContext } from "@/features/editor/types";
import { Button } from "@/design-system/Button";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";
import {
  IMAGE_QUIZ_LIMITS,
  IMAGE_QUIZ_MAX_ANSWERS,
  IMAGE_QUIZ_MAX_QUESTIONS,
  IMAGE_QUIZ_MIN_ANSWERS,
} from "@/features/templates/image-quiz/validation";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, "0")
    .slice(0, 12)}`;
}

function emptyAnswer(): QuizAnswer {
  return { id: newId(), content: { text: "" } };
}

function emptyQuestion(): ImageQuizQuestion {
  const a1 = emptyAnswer();
  const a2 = emptyAnswer();
  return {
    id: newId(),
    prompt: { text: "" },
    revealImageAssetId: null,
    revealImageAlt: "",
    answers: [a1, a2],
    correctAnswerId: a1.id,
  };
}

export function ImageQuizEditor(
  context: EditorAdapterContext<ImageQuizContentV1>,
): ReactElement {
  const {
    draft,
    onDraftChange,
    onDirty,
    openMediaModal,
    validation,
    limits,
    RichContentField,
  } = context;

  const baseId = useId();
  const helper = limits.helperCopy ?? IMAGE_QUIZ_LIMITS.helperCopy;
  const maxQuestions = limits.maxItems ?? IMAGE_QUIZ_MAX_QUESTIONS;

  const commit = useCallback(
    (next: ImageQuizContentV1) => {
      onDraftChange(next);
      onDirty();
    },
    [onDraftChange, onDirty],
  );

  const updateQuestion = (
    questionId: string,
    patch: Partial<ImageQuizQuestion>,
  ) => {
    commit({
      ...draft,
      questions: draft.questions.map((q) =>
        q.id === questionId ? { ...q, ...patch, id: q.id } : q,
      ),
    });
  };

  const addQuestion = () => {
    if (draft.questions.length >= maxQuestions) return;
    commit({ ...draft, questions: [...draft.questions, emptyQuestion()] });
  };

  const deleteQuestion = (questionId: string) => {
    commit({
      ...draft,
      questions: draft.questions.filter((q) => q.id !== questionId),
    });
  };

  const duplicateQuestion = (questionId: string) => {
    if (draft.questions.length >= maxQuestions) return;
    const index = draft.questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;
    const source = draft.questions[index]!;
    const answerIdMap = new Map<string, string>();
    const answers = source.answers.map((a) => {
      const nid = newId();
      answerIdMap.set(a.id, nid);
      return { id: nid, content: { ...a.content } };
    });
    const copy: ImageQuizQuestion = {
      id: newId(),
      prompt: { ...source.prompt },
      revealImageAssetId: source.revealImageAssetId,
      revealImageAlt: source.revealImageAlt,
      answers,
      correctAnswerId: source.correctAnswerId
        ? (answerIdMap.get(source.correctAnswerId) ?? answers[0]?.id ?? null)
        : (answers[0]?.id ?? null),
    };
    const questions = [...draft.questions];
    questions.splice(index + 1, 0, copy);
    commit({ ...draft, questions });
  };

  const moveQuestion = (questionId: string, direction: -1 | 1) => {
    const index = draft.questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= draft.questions.length) return;
    const questions = [...draft.questions];
    const [row] = questions.splice(index, 1);
    questions.splice(target, 0, row!);
    commit({ ...draft, questions });
  };

  const updateAnswerContent = (
    questionId: string,
    answerId: string,
    content: RichContent,
  ) => {
    const q = draft.questions.find((x) => x.id === questionId);
    if (!q) return;
    updateQuestion(questionId, {
      answers: q.answers.map((a) =>
        a.id === answerId ? { ...a, content } : a,
      ),
    });
  };

  const addAnswer = (questionId: string) => {
    const q = draft.questions.find((x) => x.id === questionId);
    if (!q || q.answers.length >= IMAGE_QUIZ_MAX_ANSWERS) return;
    updateQuestion(questionId, {
      answers: [...q.answers, emptyAnswer()],
    });
  };

  const deleteAnswer = (questionId: string, answerId: string) => {
    const q = draft.questions.find((x) => x.id === questionId);
    if (!q || q.answers.length <= IMAGE_QUIZ_MIN_ANSWERS) return;
    const answers = q.answers.filter((a) => a.id !== answerId);
    let correctAnswerId = q.correctAnswerId;
    if (correctAnswerId === answerId) {
      correctAnswerId = answers[0]?.id ?? null;
    }
    updateQuestion(questionId, { answers, correctAnswerId });
  };

  const moveAnswer = (
    questionId: string,
    answerId: string,
    direction: -1 | 1,
  ) => {
    const q = draft.questions.find((x) => x.id === questionId);
    if (!q) return;
    const index = q.answers.findIndex((a) => a.id === answerId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= q.answers.length) return;
    const answers = [...q.answers];
    const [row] = answers.splice(index, 1);
    answers.splice(target, 0, row!);
    updateQuestion(questionId, { answers });
  };

  const setCorrect = (questionId: string, answerId: string) => {
    updateQuestion(questionId, { correctAnswerId: answerId });
  };

  const errorMessages = validation
    .filter((v) => v.severity === "error")
    .map((v) => v.message);
  const warningMessages = validation
    .filter((v) => v.severity === "warning")
    .map((v) => v.message);

  const issueFor = (...path: Array<string | number>) =>
    validation.find(
      (v) =>
        v.path.length === path.length &&
        v.path.every((p, i) => p === path[i]),
    );

  return (
    <div
      className="flex flex-col gap-4 text-[var(--fw-color-ink)]"
      data-template-editor="image-quiz"
    >
      <p className="text-sm text-[var(--fw-color-muted-strong)]">{helper}</p>

      {(errorMessages.length > 0 || warningMessages.length > 0) && (
        <div className="flex flex-col gap-1" role="status">
          {errorMessages.map((msg) => (
            <p
              key={`e-${msg}`}
              className="text-sm text-[var(--fw-color-danger-text)]"
            >
              {msg}
            </p>
          ))}
          {warningMessages.map((msg) => (
            <p
              key={`w-${msg}`}
              className="text-sm text-[var(--fw-color-warning)]"
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      <ul
        className="flex list-none flex-col gap-4 p-0"
        aria-label="Image quiz questions"
      >
        {draft.questions.map((question, qIndex) => {
          const revealIssue =
            issueFor("questions", qIndex, "revealImageAssetId") ||
            issueFor("questions", qIndex, "revealImageAlt");

          return (
            <li
              key={question.id}
              className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-3"
              data-testid={`image-quiz-question-${qIndex}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--fw-color-muted-strong)]">
                  {IMAGE_QUIZ_COPY.questionLabel} {qIndex + 1}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2 text-sm"
                    onClick={() => moveQuestion(question.id, -1)}
                    disabled={qIndex === 0}
                    aria-label={IMAGE_QUIZ_COPY.moveUp}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2 text-sm"
                    onClick={() => moveQuestion(question.id, 1)}
                    disabled={qIndex === draft.questions.length - 1}
                    aria-label={IMAGE_QUIZ_COPY.moveDown}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-2 text-sm"
                    onClick={() => duplicateQuestion(question.id)}
                    disabled={draft.questions.length >= maxQuestions}
                  >
                    {IMAGE_QUIZ_COPY.duplicateQuestion}
                  </Button>
                  <Button
                    variant="danger"
                    className="min-h-9 px-2 text-sm"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    {IMAGE_QUIZ_COPY.deleteQuestion}
                  </Button>
                </div>
              </div>

              <div className="mb-3 flex flex-col gap-2">
                <span className="text-sm font-semibold">
                  {IMAGE_QUIZ_COPY.promptLabel}
                </span>
                {RichContentField ? (
                  (RichContentField({
                    value: question.prompt,
                    onChange: (prompt) =>
                      updateQuestion(question.id, { prompt }),
                    label: IMAGE_QUIZ_COPY.promptLabel,
                  }) as ReactElement)
                ) : (
                  <input
                    type="text"
                    value={question.prompt.text ?? ""}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        prompt: { ...question.prompt, text: e.target.value },
                      })
                    }
                    className="min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] px-3 py-2 text-base"
                    aria-label={IMAGE_QUIZ_COPY.promptLabel}
                  />
                )}
              </div>

              <div
                className="mb-3 flex flex-col gap-2 rounded-[var(--fw-radius-sm)] border border-dashed border-[var(--fw-color-border)] p-3"
                data-testid={`image-quiz-reveal-${qIndex}`}
              >
                <span className="text-sm font-semibold">
                  {IMAGE_QUIZ_COPY.revealImageLabel}
                </span>
                {question.revealImageAssetId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-[var(--fw-radius-sm)] bg-[var(--fw-color-tile-pale)] px-2 py-1 text-xs"
                      data-testid={`image-quiz-reveal-id-${qIndex}`}
                    >
                      {question.revealImageAssetId.slice(0, 8)}…
                    </span>
                    <Button
                      variant="secondary"
                      className="min-h-9 text-sm"
                      onClick={() =>
                        openMediaModal({
                          kind: "question",
                          questionId: question.id,
                          channel: "revealImage",
                        })
                      }
                    >
                      {IMAGE_QUIZ_COPY.changeRevealImage}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-9 text-sm"
                      onClick={() =>
                        updateQuestion(question.id, {
                          revealImageAssetId: null,
                          revealImageAlt: "",
                        })
                      }
                    >
                      {IMAGE_QUIZ_COPY.removeRevealImage}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="self-start text-sm"
                    onClick={() =>
                      openMediaModal({
                        kind: "question",
                        questionId: question.id,
                        channel: "revealImage",
                      })
                    }
                    data-testid={`image-quiz-choose-reveal-${qIndex}`}
                  >
                    {IMAGE_QUIZ_COPY.chooseRevealImage}
                  </Button>
                )}
                <label
                  className="flex flex-col gap-1 text-sm"
                  htmlFor={`${baseId}-alt-${question.id}`}
                >
                  {IMAGE_QUIZ_COPY.revealImageAltLabel}
                  <input
                    id={`${baseId}-alt-${question.id}`}
                    type="text"
                    value={question.revealImageAlt ?? ""}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        revealImageAlt: e.target.value,
                      })
                    }
                    maxLength={500}
                    className="min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] px-3 py-2 text-base"
                    aria-invalid={revealIssue ? true : undefined}
                  />
                </label>
                {revealIssue ? (
                  <p
                    className="text-sm text-[var(--fw-color-danger-text)]"
                    role="alert"
                    data-testid={`image-quiz-reveal-error-${qIndex}`}
                  >
                    {revealIssue.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">
                  {IMAGE_QUIZ_COPY.answersLabel}
                </span>
                <ul className="flex list-none flex-col gap-2 p-0">
                  {question.answers.map((answer, aIndex) => (
                    <li
                      key={answer.id}
                      className="flex flex-col gap-2 rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] p-2 sm:flex-row sm:items-start"
                    >
                      <label className="flex min-h-[var(--fw-touch-min)] items-center gap-2 text-sm font-semibold">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswerId === answer.id}
                          onChange={() => setCorrect(question.id, answer.id)}
                          aria-label={`${IMAGE_QUIZ_COPY.markCorrect} ${aIndex + 1}`}
                        />
                        {IMAGE_QUIZ_COPY.answerLabel} {aIndex + 1}
                      </label>
                      <div className="min-w-0 flex-1">
                        {RichContentField ? (
                          (RichContentField({
                            value: answer.content,
                            onChange: (content) =>
                              updateAnswerContent(
                                question.id,
                                answer.id,
                                content,
                              ),
                          }) as ReactElement)
                        ) : (
                          <input
                            type="text"
                            value={answer.content.text ?? ""}
                            onChange={(e) =>
                              updateAnswerContent(question.id, answer.id, {
                                ...answer.content,
                                text: e.target.value,
                              })
                            }
                            className="w-full min-h-[var(--fw-touch-min)] rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] px-3 py-2 text-base"
                            aria-label={`${IMAGE_QUIZ_COPY.answerLabel} ${aIndex + 1}`}
                          />
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs"
                            onClick={() =>
                              openMediaModal({
                                kind: "answer",
                                questionId: question.id,
                                answerId: answer.id,
                                channel: "image",
                              })
                            }
                          >
                            Image
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => moveAnswer(question.id, answer.id, -1)}
                            disabled={aIndex === 0}
                            aria-label={IMAGE_QUIZ_COPY.moveUp}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => moveAnswer(question.id, answer.id, 1)}
                            disabled={aIndex === question.answers.length - 1}
                            aria-label={IMAGE_QUIZ_COPY.moveDown}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs"
                            onClick={() =>
                              deleteAnswer(question.id, answer.id)
                            }
                            disabled={
                              question.answers.length <= IMAGE_QUIZ_MIN_ANSWERS
                            }
                          >
                            {IMAGE_QUIZ_COPY.deleteAnswer}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  className="self-start text-sm"
                  onClick={() => addAnswer(question.id)}
                  disabled={question.answers.length >= IMAGE_QUIZ_MAX_ANSWERS}
                >
                  {IMAGE_QUIZ_COPY.addAnswer}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Button
        variant="primary"
        onClick={addQuestion}
        disabled={draft.questions.length >= maxQuestions}
        data-testid="image-quiz-add-question"
      >
        {IMAGE_QUIZ_COPY.addQuestion}
      </Button>
    </div>
  );
}
