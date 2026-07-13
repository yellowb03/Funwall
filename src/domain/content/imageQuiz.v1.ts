import { z } from "zod";
import {
  hasMeaningfulContent,
  richContentSchema,
} from "@/domain/rich-content";
import { quizAnswerSchema } from "@/domain/content/quiz.v1";

/**
 * imageQuiz.v1 — native content family for Image quiz.
 * Minimum playable: 1 question, reveal image, 2-6 answers, exactly one correct.
 */
export const imageQuizQuestionSchema = z.object({
  id: z.string().uuid(),
  prompt: richContentSchema,
  /** Required reveal image asset for playable packs. */
  revealImageAssetId: z.string().uuid().nullable().optional(),
  revealImageAlt: z.string().max(500).optional(),
  answers: z.array(quizAnswerSchema).min(0).max(6),
  correctAnswerId: z.string().uuid().nullable().optional(),
});

export const imageQuizContentV1Schema = z.object({
  family: z.literal("imageQuiz"),
  version: z.literal(1),
  questions: z.array(imageQuizQuestionSchema).min(0).max(100),
});

export const imageQuizContentV1PlayableSchema =
  imageQuizContentV1Schema.superRefine((value, ctx) => {
    if (value.questions.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Playable image quiz requires at least 1 question",
        path: ["questions"],
      });
      return;
    }

    value.questions.forEach((question, qIndex) => {
      if (!question.revealImageAssetId) {
        ctx.addIssue({
          code: "custom",
          message: "revealImageAssetId is required",
          path: ["questions", qIndex, "revealImageAssetId"],
        });
      } else if (!question.revealImageAlt?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "revealImageAlt is required when reveal image is present",
          path: ["questions", qIndex, "revealImageAlt"],
        });
      }

      const meaningfulAnswers = question.answers.filter((a) =>
        hasMeaningfulContent(a.content),
      );
      if (meaningfulAnswers.length < 2 || meaningfulAnswers.length > 6) {
        ctx.addIssue({
          code: "custom",
          message: "Each question needs 2-6 meaningful answers",
          path: ["questions", qIndex, "answers"],
        });
      }

      if (!question.correctAnswerId) {
        ctx.addIssue({
          code: "custom",
          message: "Exactly one correct answer is required",
          path: ["questions", qIndex, "correctAnswerId"],
        });
      } else if (
        !question.answers.some((a) => a.id === question.correctAnswerId)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "correctAnswerId must match an answer id",
          path: ["questions", qIndex, "correctAnswerId"],
        });
      }
    });
  });

export type ImageQuizQuestion = z.infer<typeof imageQuizQuestionSchema>;
export type ImageQuizContentV1 = z.infer<typeof imageQuizContentV1Schema>;
