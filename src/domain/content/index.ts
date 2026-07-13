import { z } from "zod";
import {
  listContentV1PlayableSchema,
  listContentV1Schema,
  type ListContentV1,
} from "@/domain/content/list.v1";
import {
  pairsContentV1PlayableSchema,
  pairsContentV1Schema,
  type PairsContentV1,
} from "@/domain/content/pairs.v1";
import {
  quizContentV1PlayableSchema,
  quizContentV1Schema,
  type QuizContentV1,
} from "@/domain/content/quiz.v1";
import {
  wordsearchContentV1PlayableSchema,
  wordsearchContentV1Schema,
  type WordsearchContentV1,
} from "@/domain/content/wordsearch.v1";
import {
  imageQuizContentV1PlayableSchema,
  imageQuizContentV1Schema,
  type ImageQuizContentV1,
} from "@/domain/content/imageQuiz.v1";
import {
  statementsContentV1PlayableSchema,
  statementsContentV1Schema,
  type StatementsContentV1,
} from "@/domain/content/statements.v1";

export * from "@/domain/content/list.v1";
export * from "@/domain/content/pairs.v1";
export * from "@/domain/content/quiz.v1";
export * from "@/domain/content/wordsearch.v1";
export * from "@/domain/content/imageQuiz.v1";
export * from "@/domain/content/statements.v1";

export const CONTENT_FAMILIES = [
  "list",
  "pairs",
  "quiz",
  "wordsearch",
  "imageQuiz",
  "statements",
] as const;

export type ContentFamily = (typeof CONTENT_FAMILIES)[number];

export type ContentPackV1 =
  | ListContentV1
  | PairsContentV1
  | QuizContentV1
  | WordsearchContentV1
  | ImageQuizContentV1
  | StatementsContentV1;

/** Discriminated draft pack (autosave may be incomplete). */
export const contentPackDraftSchema = z.discriminatedUnion("family", [
  listContentV1Schema,
  pairsContentV1Schema,
  quizContentV1Schema,
  wordsearchContentV1Schema,
  imageQuizContentV1Schema,
  statementsContentV1Schema,
]);

/**
 * Reject unknown family/version combinations until a migration exists.
 * Prefer family-specific parsers when the family is already known.
 */
export function parseContentPackDraft(input: unknown) {
  return contentPackDraftSchema.safeParse(input);
}

export function parsePlayableContentPack(input: unknown) {
  const draft = contentPackDraftSchema.safeParse(input);
  if (!draft.success) {
    return draft;
  }

  switch (draft.data.family) {
    case "list":
      return listContentV1PlayableSchema.safeParse(draft.data);
    case "pairs":
      return pairsContentV1PlayableSchema.safeParse(draft.data);
    case "quiz":
      return quizContentV1PlayableSchema.safeParse(draft.data);
    case "wordsearch":
      return wordsearchContentV1PlayableSchema.safeParse(draft.data);
    case "imageQuiz":
      return imageQuizContentV1PlayableSchema.safeParse(draft.data);
    case "statements":
      return statementsContentV1PlayableSchema.safeParse(draft.data);
    default: {
      const _exhaustive: never = draft.data;
      return {
        success: false as const,
        error: new Error(`Unhandled family: ${JSON.stringify(_exhaustive)}`),
      };
    }
  }
}
