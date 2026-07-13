import { z } from "zod";
import {
  hasMeaningfulContent,
  richContentSchema,
} from "@/domain/rich-content";

/**
 * statements.v1 — native content family for True/False.
 * Minimum playable: 2 statements with explicit boolean values.
 */
export const statementSchema = z.object({
  id: z.string().uuid(),
  content: richContentSchema,
  /** Explicit truth value; null only allowed in incomplete drafts. */
  isTrue: z.boolean().nullable(),
});

export const statementsContentV1Schema = z.object({
  family: z.literal("statements"),
  version: z.literal(1),
  statements: z.array(statementSchema).min(0).max(100),
});

export const statementsContentV1PlayableSchema =
  statementsContentV1Schema.superRefine((value, ctx) => {
    const complete = value.statements.filter(
      (s) => hasMeaningfulContent(s.content) && typeof s.isTrue === "boolean",
    );
    if (complete.length < 2) {
      ctx.addIssue({
        code: "custom",
        message:
          "Playable statements require at least 2 items with content and boolean isTrue",
        path: ["statements"],
      });
    }

    value.statements.forEach((statement, index) => {
      if (statement.isTrue === null) {
        ctx.addIssue({
          code: "custom",
          message: "isTrue must be explicit true or false",
          path: ["statements", index, "isTrue"],
        });
      }
    });
  });

export type Statement = z.infer<typeof statementSchema>;
export type StatementsContentV1 = z.infer<typeof statementsContentV1Schema>;
