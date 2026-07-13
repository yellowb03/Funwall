import { z } from "zod";

/**
 * Frozen product template keys. Exactly six launch templates.
 * @see agent-work/shared/CONTRACTS.md §2
 */
export const TEMPLATE_KEYS = [
  "wheel",
  "matching-pairs",
  "gameshow-quiz",
  "wordsearch",
  "image-quiz",
  "true-false",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const templateKeySchema = z.enum(TEMPLATE_KEYS);

export function isTemplateKey(value: string): value is TemplateKey {
  return (TEMPLATE_KEYS as readonly string[]).includes(value);
}
