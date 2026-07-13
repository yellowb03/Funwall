"use client";

import type { ReactElement } from "react";
import type { ResultContract } from "@/domain/result";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";
import type { QuestionResultDetail } from "@/features/templates/image-quiz/session";

export interface ImageQuizReviewProps {
  result: ResultContract;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function readResults(result: ResultContract): QuestionResultDetail[] {
  const data = result.templateDetail?.data as
    | { results?: QuestionResultDetail[] }
    | undefined;
  return Array.isArray(data?.results) ? data.results : [];
}

/**
 * Template-specific scored review: prompt summary, buzz time, tiles, points.
 */
export function ImageQuizReview({
  result,
}: ImageQuizReviewProps): ReactElement {
  const results = readResults(result);
  const accuracy =
    result.accuracy != null ? Math.round(result.accuracy * 100) : null;

  return (
    <div
      className="flex w-full flex-col gap-4 p-4 text-[var(--fw-color-ink)]"
      data-testid="image-quiz-result-review"
      data-template-review="image-quiz"
    >
      <h2 className="text-center text-2xl font-bold">
        {result.status === "gameOver"
          ? IMAGE_QUIZ_COPY.gameOver
          : IMAGE_QUIZ_COPY.complete}
      </h2>

      <dl className="mx-auto grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-[var(--fw-color-muted-strong)]">
          {IMAGE_QUIZ_COPY.scoreLabel}
        </dt>
        <dd className="font-semibold" data-testid="image-quiz-review-score">
          {result.score ?? 0}
        </dd>
        {accuracy != null ? (
          <>
            <dt className="text-[var(--fw-color-muted-strong)]">Accuracy</dt>
            <dd className="font-semibold">{accuracy}%</dd>
          </>
        ) : null}
        <dt className="text-[var(--fw-color-muted-strong)]">Duration</dt>
        <dd className="font-semibold">{formatDuration(result.durationMs)}</dd>
        {result.correctCount != null ? (
          <>
            <dt className="text-[var(--fw-color-muted-strong)]">Correct</dt>
            <dd className="font-semibold">{result.correctCount}</dd>
          </>
        ) : null}
      </dl>

      {results.length > 0 ? (
        <ul
          className="mx-auto flex w-full max-w-lg list-none flex-col gap-2 p-0"
          data-testid="image-quiz-review-questions"
        >
          {results.map((r, index) => (
            <li
              key={r.questionId}
              className="rounded-[var(--fw-radius-md)] border border-[var(--fw-color-border)] bg-[var(--fw-color-surface)] p-3 text-sm"
            >
              <p className="font-semibold">
                {IMAGE_QUIZ_COPY.questionLabel} {index + 1}
              </p>
              <p>
                Outcome: <strong>{r.outcome}</strong> · {r.points} pts
              </p>
              <p className="text-[var(--fw-color-muted-strong)]">
                Tiles at buzz: {r.tilesRevealedAtBuzz}/{r.tileCount}
                {r.buzzed
                  ? ` · buzz @ ${Math.round((r.buzzElapsedMs ?? 0) / 100) / 10}s`
                  : " · full reveal"}
                {r.answerElapsedMs != null
                  ? ` · answer ${Math.round(r.answerElapsedMs)}ms`
                  : ""}
              </p>
              {r.scoreBreakdown ? (
                <p className="text-xs text-[var(--fw-color-muted)]">
                  base {r.scoreBreakdown.baseAwarded} + reveal{" "}
                  {r.scoreBreakdown.revealBonus} + speed{" "}
                  {r.scoreBreakdown.speedBonus}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
