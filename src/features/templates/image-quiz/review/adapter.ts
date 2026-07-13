"use client";

import { createElement, type ReactElement } from "react";
import type { ResultContract } from "@/domain/result";
import { ImageQuizReview } from "@/features/templates/image-quiz/review/ImageQuizReview";

export interface ResultReviewAdapter {
  render(context: { result: ResultContract }): unknown;
}

/**
 * Scored result review adapter for Image Quiz.
 * Renders per-question buzz/tiles/points detail from templateDetail.
 */
export function createResultReviewAdapter(): ResultReviewAdapter {
  return {
    render(context): ReactElement {
      return createElement(ImageQuizReview, { result: context.result });
    },
  };
}

export async function loadImageQuizResultReviewAdapterModule() {
  return {
    createResultReviewAdapter,
  };
}
