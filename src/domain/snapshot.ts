import { z } from "zod";
import { contentPackDraftSchema } from "@/domain/content";
import { templateKeySchema } from "@/domain/template-keys";

/**
 * Public activity snapshot delivered to the player.
 * Immutable for the session; sanitized of owner-only fields.
 * @see agent-work/shared/CONTRACTS.md §2, §6
 */
export const publicActivitySnapshotSchema = z.object({
  activityId: z.string().uuid(),
  publicSlug: z.string().min(8).max(128),
  revision: z.number().int().nonnegative(),
  title: z.string().min(1).max(200),
  instruction: z.string().max(2000).optional(),
  templateKey: templateKeySchema,
  templateVersion: z.number().int().positive(),
  content: contentPackDraftSchema,
  settings: z.record(z.string(), z.unknown()),
  themeKey: z.string().min(1).max(64),
  /** Capability flags mirrored from registry for shell decisions. */
  isScored: z.boolean(),
  hasLeaderboard: z.boolean(),
});

export type PublicActivitySnapshot = z.infer<
  typeof publicActivitySnapshotSchema
>;
