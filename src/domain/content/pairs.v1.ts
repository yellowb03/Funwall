import { z } from "zod";
import {
  hasMeaningfulContent,
  richContentSchema,
} from "@/domain/rich-content";

/**
 * pairs.v1 — native content family for Matching pairs.
 * Minimum playable: 2 complete pairs.
 */
export const pairModeSchema = z.enum(["identical", "related"]);

export const pairSchema = z.object({
  id: z.string().uuid(),
  left: richContentSchema,
  right: richContentSchema,
});

export const pairsContentV1Schema = z.object({
  family: z.literal("pairs"),
  version: z.literal(1),
  pairMode: pairModeSchema.default("related"),
  pairs: z.array(pairSchema).min(0).max(50),
});

export const pairsContentV1PlayableSchema = pairsContentV1Schema.superRefine(
  (value, ctx) => {
    const complete = value.pairs.filter(
      (pair) =>
        hasMeaningfulContent(pair.left) && hasMeaningfulContent(pair.right),
    );
    if (complete.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Playable pairs require at least 2 complete pairs",
        path: ["pairs"],
      });
    }
  },
);

export type PairMode = z.infer<typeof pairModeSchema>;
export type Pair = z.infer<typeof pairSchema>;
export type PairsContentV1 = z.infer<typeof pairsContentV1Schema>;
