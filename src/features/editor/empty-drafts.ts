import type { ContentPackV1 } from "@/domain/content";
import type { TemplateKey } from "@/domain/template-keys";

/**
 * Empty draft content packs for each launch template.
 * Autosave accepts incomplete drafts; Done requires playable validation.
 */
export function emptyContentForTemplate(templateKey: TemplateKey): ContentPackV1 {
  switch (templateKey) {
    case "wheel":
      return { family: "list", version: 1, items: [] };
    case "matching-pairs":
      return { family: "pairs", version: 1, pairMode: "related", pairs: [] };
    case "gameshow-quiz":
      return { family: "quiz", version: 1, questions: [] };
    case "wordsearch":
      return { family: "wordsearch", version: 1, words: [] };
    case "image-quiz":
      return { family: "imageQuiz", version: 1, questions: [] };
    case "true-false":
      return { family: "statements", version: 1, statements: [] };
    default: {
      const _exhaustive: never = templateKey;
      return _exhaustive;
    }
  }
}
