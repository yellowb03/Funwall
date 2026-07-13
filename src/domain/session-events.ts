import { z } from "zod";

/**
 * Session event envelope.
 * @see agent-work/shared/CONTRACTS.md §8
 */
export const commonSessionEventTypeSchema = z.enum([
  "session.started",
  "game.ready",
  "game.paused",
  "game.resumed",
  "item.presented",
  "answer.submitted",
  "answer.resolved",
  "lifeline.used",
  "bonus.resolved",
  "game.completed",
  "game.over",
  "session.abandoned",
]);

export type CommonSessionEventType = z.infer<
  typeof commonSessionEventTypeSchema
>;

/** Template-specific events use a template-prefixed type string. */
export const sessionEventTypeSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9]*(\.[a-zA-Z0-9]+)+$/);

export const sessionEventEnvelopeSchema = z.object({
  sessionId: z.string().uuid(),
  /** Monotonic client sequence number starting at 1. */
  sequence: z.number().int().positive(),
  type: sessionEventTypeSchema,
  /** Monotonic elapsed ms from session start (excluding intentional pause policy is shell-owned). */
  elapsedMs: z.number().int().nonnegative(),
  itemId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SessionEventEnvelope = z.infer<typeof sessionEventEnvelopeSchema>;

export interface SessionEventEmitter {
  emit(event: Omit<SessionEventEnvelope, "sessionId" | "sequence">): void;
}
