import { z } from "zod";
import { templateKeySchema } from "@/domain/template-keys";

/**
 * Result contract for completed/abandoned play sessions.
 * @see agent-work/shared/CONTRACTS.md §9
 */
export const resultStatusSchema = z.enum([
  "completed",
  "gameOver",
  "abandoned",
  "invalid",
]);

export type ResultStatus = z.infer<typeof resultStatusSchema>;

export const resultContractSchema = z.object({
  sessionId: z.string().uuid(),
  templateKey: templateKeySchema,
  templateVersion: z.number().int().positive(),
  activityId: z.string().uuid(),
  activityRevision: z.number().int().nonnegative(),
  seed: z.string().min(1),
  status: resultStatusSchema,
  /** Null for unscored templates (Wheel). */
  score: z.number().int().nonnegative().nullable(),
  correctCount: z.number().int().nonnegative().nullable().optional(),
  incorrectCount: z.number().int().nonnegative().nullable().optional(),
  unansweredCount: z.number().int().nonnegative().nullable().optional(),
  accuracy: z.number().min(0).max(1).nullable().optional(),
  durationMs: z.number().int().nonnegative(),
  templateDetail: z.object({
    version: z.number().int().positive(),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  completedAt: z.string().datetime().nullable(),
});

export type ResultContract = z.infer<typeof resultContractSchema>;
