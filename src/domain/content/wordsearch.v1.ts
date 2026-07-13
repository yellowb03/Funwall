import { z } from "zod";
import { richContentSchema } from "@/domain/rich-content";

/**
 * wordsearch.v1 — native content family for Wordsearch.
 * Minimum playable: 2 unique normalized words that fit policy.
 */
export const wordsearchEntrySchema = z.object({
  id: z.string().uuid(),
  /** Display form shown to the player. */
  displayWord: z.string().max(40),
  /** Normalized grid value (uppercase A-Z / allowed letters only). */
  normalizedWord: z.string().max(40),
  clue: richContentSchema.optional(),
});

export const wordsearchContentV1Schema = z.object({
  family: z.literal("wordsearch"),
  version: z.literal(1),
  words: z.array(wordsearchEntrySchema).min(0).max(40),
});

const NORMALIZED_WORD_RE = /^[A-Z]+$/;

export const wordsearchContentV1PlayableSchema =
  wordsearchContentV1Schema.superRefine((value, ctx) => {
    const normalized = value.words
      .map((w) => w.normalizedWord.trim().toUpperCase())
      .filter(Boolean);

    if (normalized.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Playable wordsearch requires at least 2 words",
        path: ["words"],
      });
    }

    const seen = new Set<string>();
    value.words.forEach((word, index) => {
      const n = word.normalizedWord.trim().toUpperCase();
      if (!n || !NORMALIZED_WORD_RE.test(n) || n.length < 2) {
        ctx.addIssue({
          code: "custom",
          message:
            "normalizedWord must be 2+ uppercase letters (A-Z) for grid placement",
          path: ["words", index, "normalizedWord"],
        });
      }
      if (seen.has(n)) {
        ctx.addIssue({
          code: "custom",
          message: "normalizedWord values must be unique",
          path: ["words", index, "normalizedWord"],
        });
      }
      seen.add(n);
    });
  });

export type WordsearchEntry = z.infer<typeof wordsearchEntrySchema>;
export type WordsearchContentV1 = z.infer<typeof wordsearchContentV1Schema>;
