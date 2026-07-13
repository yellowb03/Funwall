import { z } from "zod";
import {
  hasMeaningfulContent,
  richContentSchema,
} from "@/domain/rich-content";

/**
 * list.v1 — native content family for Spin the wheel.
 * Minimum playable: 2 non-empty items.
 */
export const listItemSchema = z.object({
  id: z.string().uuid(),
  content: richContentSchema,
});

export const listContentV1Schema = z.object({
  family: z.literal("list"),
  version: z.literal(1),
  instruction: z.string().max(2000).optional(),
  items: z.array(listItemSchema).min(0).max(100),
});

export const listContentV1PlayableSchema = listContentV1Schema.superRefine(
  (value, ctx) => {
    const meaningful = value.items.filter((item) =>
      hasMeaningfulContent(item.content),
    );
    if (meaningful.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Playable list requires at least 2 non-empty items",
        path: ["items"],
      });
    }
  },
);

export type ListItem = z.infer<typeof listItemSchema>;
export type ListContentV1 = z.infer<typeof listContentV1Schema>;
