import { z } from "zod";
import {
  hasMeaningfulContent,
  richContentSchema,
} from "@/domain/rich-content";

/**
 * quiz.v1 — native content family for Gameshow quiz.
 * Minimum playable: 1 question, 2-6 answers, exactly one correct.
 */
export const quizAnswerSchema = z.object({
  id: z.string().uuid(),
  content: richContentSchema,
});

export const quizQuestionSchema = z.object({
  id: z.string().uuid(),
  prompt: richContentSchema,
  answers: z.array(quizAnswerSchema).min(0).max(6),
  correctAnswerId: z.string().uuid().nullable().optional(),
});

export const quizContentV1Schema = z.object({
  family: z.literal("quiz"),
  version: z.literal(1),
  questions: z.array(quizQuestionSchema).min(0).max(100),
});

export const quizContentV1PlayableSchema = quizContentV1Schema.superRefine(
  (value, ctx) => {
    if (value.questions.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Playable quiz requires at least 1 question",
        path: ["questions"],
      });
      return;
    }

    value.questions.forEach((question, qIndex) => {
      if (!hasMeaningfulContent(question.prompt)) {
        ctx.addIssue({
          code: "custom",
          message: "Question prompt must have meaningful content",
          path: ["questions", qIndex, "prompt"],
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
      } else {
        const match = question.answers.find(
          (a) => a.id === question.correctAnswerId,
        );
        if (!match) {
          ctx.addIssue({
            code: "custom",
            message: "correctAnswerId must match an answer id",
            path: ["questions", qIndex, "correctAnswerId"],
          });
        }
      }
    });
  },
);

export type QuizAnswer = z.infer<typeof quizAnswerSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizContentV1 = z.infer<typeof quizContentV1Schema>;
