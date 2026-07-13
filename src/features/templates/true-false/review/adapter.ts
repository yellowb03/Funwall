"use client";

import { createElement, type ReactElement } from "react";
import type { ResultContract } from "@/domain/result";

export interface TrueFalseResultReviewProps {
  result: ResultContract;
  title?: string;
}

/**
 * Lightweight template-owned result detail for scored True/False sessions.
 * Shell ResultReview still owns score/leaderboard chrome; this exposes attempts.
 */
export function TrueFalseResultReview({
  result,
  title,
}: TrueFalseResultReviewProps): ReactElement {
  const data = result.templateDetail?.data as
    | {
        attempts?: Array<{
          attemptKey: string;
          statementId: string;
          truth: boolean;
          playerAnswer: boolean | null;
          kind: string;
          points: number;
        }>;
        bestStreak?: number;
      }
    | undefined;

  const attempts = data?.attempts ?? [];

  return createElement(
    "div",
    {
      "data-testid": "true-false-result-review",
      className:
        "flex w-full max-w-lg flex-col gap-2 text-left text-sm text-[var(--fw-color-ink)]",
    },
    title
      ? createElement(
          "h3",
          { className: "text-base font-semibold" },
          title,
        )
      : null,
    createElement(
      "p",
      { className: "text-[var(--fw-color-muted-strong)]" },
      `Best streak: ${data?.bestStreak ?? 0}`,
    ),
    createElement(
      "ul",
      {
        className: "list-none space-y-1 p-0",
        "data-testid": "tf-result-attempts",
      },
      ...attempts.map((a) =>
        createElement(
          "li",
          {
            key: a.attemptKey,
            className:
              "rounded-[var(--fw-radius-sm)] border border-[var(--fw-color-border)] px-2 py-1",
            "data-kind": a.kind,
          },
          createElement(
            "span",
            null,
            `${a.kind} · truth ${a.truth ? "T" : "F"} · answer ${
              a.playerAnswer === null ? "—" : a.playerAnswer ? "T" : "F"
            } · ${a.points} pts`,
          ),
        ),
      ),
    ),
  );
}

export function createResultReviewAdapter() {
  return {
    render(props: TrueFalseResultReviewProps) {
      return TrueFalseResultReview(props);
    },
  };
}

export async function loadTrueFalseResultReviewAdapterModule() {
  return {
    createResultReviewAdapter,
  };
}
