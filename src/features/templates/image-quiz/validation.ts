import {
  imageQuizContentV1PlayableSchema,
  imageQuizContentV1Schema,
  type ImageQuizContentV1,
} from "@/domain/content/imageQuiz.v1";
import { hasMeaningfulContent } from "@/domain/rich-content";
import type { ValidationIssue } from "@/features/editor/types";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";

export const IMAGE_QUIZ_MIN_QUESTIONS = 1;
export const IMAGE_QUIZ_MAX_QUESTIONS = 100;
export const IMAGE_QUIZ_MIN_ANSWERS = 2;
export const IMAGE_QUIZ_MAX_ANSWERS = 6;

export const IMAGE_QUIZ_LIMITS = {
  minItems: IMAGE_QUIZ_MIN_QUESTIONS,
  maxItems: IMAGE_QUIZ_MAX_QUESTIONS,
  helperCopy: IMAGE_QUIZ_COPY.limits,
} as const;

/**
 * Draft validation: incomplete OK, but surface useful issues for the editor.
 */
export function validateImageQuizDraft(draft: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = imageQuizContentV1Schema.safeParse(draft);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path as Array<string | number>,
        message: issue.message,
        severity: "error",
      });
    }
    return issues;
  }

  const pack = parsed.data;

  if (pack.questions.length > IMAGE_QUIZ_MAX_QUESTIONS) {
    issues.push({
      path: ["questions"],
      message: `At most ${IMAGE_QUIZ_MAX_QUESTIONS} questions are allowed.`,
      severity: "error",
    });
  }

  if (pack.questions.length < IMAGE_QUIZ_MIN_QUESTIONS) {
    issues.push({
      path: ["questions"],
      message: IMAGE_QUIZ_COPY.valMinQuestions,
      severity: "error",
    });
  }

  pack.questions.forEach((question, qIndex) => {
    if (!hasMeaningfulContent(question.prompt)) {
      issues.push({
        path: ["questions", qIndex, "prompt"],
        message: IMAGE_QUIZ_COPY.valPromptEmpty,
        severity: "warning",
      });
    }

    if (!question.revealImageAssetId) {
      issues.push({
        path: ["questions", qIndex, "revealImageAssetId"],
        message: IMAGE_QUIZ_COPY.valRevealRequired,
        severity: "error",
      });
    } else if (!question.revealImageAlt?.trim()) {
      issues.push({
        path: ["questions", qIndex, "revealImageAlt"],
        message: IMAGE_QUIZ_COPY.valRevealAlt,
        severity: "error",
      });
    }

    const meaningfulAnswers = question.answers.filter((a) =>
      hasMeaningfulContent(a.content),
    );

    if (
      meaningfulAnswers.length < IMAGE_QUIZ_MIN_ANSWERS ||
      meaningfulAnswers.length > IMAGE_QUIZ_MAX_ANSWERS
    ) {
      issues.push({
        path: ["questions", qIndex, "answers"],
        message: IMAGE_QUIZ_COPY.valAnswers,
        severity: "error",
      });
    }

    question.answers.forEach((answer, aIndex) => {
      if (!hasMeaningfulContent(answer.content)) {
        issues.push({
          path: ["questions", qIndex, "answers", aIndex],
          message: "This answer needs text or an image.",
          severity: "warning",
        });
      }
    });

    if (!question.correctAnswerId) {
      issues.push({
        path: ["questions", qIndex, "correctAnswerId"],
        message: IMAGE_QUIZ_COPY.valCorrectRequired,
        severity: "error",
      });
    } else if (
      !question.answers.some((a) => a.id === question.correctAnswerId)
    ) {
      issues.push({
        path: ["questions", qIndex, "correctAnswerId"],
        message: IMAGE_QUIZ_COPY.valCorrectRequired,
        severity: "error",
      });
    }
  });

  return issues;
}

/**
 * Playable gate for Done / public play. Uses domain imageQuiz.v1 playable schema.
 */
export function validateImageQuizPlayable(draft: unknown): {
  ok: boolean;
  data?: ImageQuizContentV1;
  issues: ValidationIssue[];
} {
  const result = imageQuizContentV1PlayableSchema.safeParse(draft);
  if (result.success) {
    return { ok: true, data: result.data, issues: [] };
  }

  const issues: ValidationIssue[] = result.error.issues.map((issue) => {
    let message = issue.message;
    if (message.includes("at least 1 question")) {
      message = IMAGE_QUIZ_COPY.valMinQuestions;
    } else if (message.includes("revealImageAssetId is required")) {
      message = IMAGE_QUIZ_COPY.valRevealRequired;
    } else if (message.includes("revealImageAlt is required")) {
      message = IMAGE_QUIZ_COPY.valRevealAlt;
    } else if (message.includes("2-6 meaningful answers")) {
      message = IMAGE_QUIZ_COPY.valAnswers;
    } else if (
      message.includes("Exactly one correct") ||
      message.includes("correctAnswerId")
    ) {
      message = IMAGE_QUIZ_COPY.valCorrectRequired;
    }
    return {
      path: issue.path as Array<string | number>,
      message,
      severity: "error" as const,
    };
  });

  return { ok: false, issues };
}

export function isImageQuizPlayable(draft: unknown): boolean {
  return imageQuizContentV1PlayableSchema.safeParse(draft).success;
}
