import {
  wordsearchContentV1PlayableSchema,
  wordsearchContentV1Schema,
  type WordsearchContentV1,
} from "@/domain/content/wordsearch.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { WORDSEARCH_COPY } from "@/features/templates/wordsearch/copy";
import {
  defaultWordsearchSettings,
  migrateWordsearchSettings,
  wordsearchSettingsSchema,
  type WordsearchSettings,
} from "@/features/templates/wordsearch/settings";

export {
  defaultWordsearchSettings,
  migrateWordsearchSettings,
  wordsearchSettingsSchema,
  type WordsearchSettings,
  type WordsearchSelectionMode,
  type WordsearchLetterCase,
  type WordsearchDiacriticPolicy,
} from "@/features/templates/wordsearch/settings";

/**
 * Lazy loaders — dynamic import keeps react-dom/client out of the server graph.
 */
async function loadWordsearchEditorAdapterModule() {
  const mod = await import("@/features/templates/wordsearch/editor/adapter");
  return { createEditorAdapter: mod.createEditorAdapter };
}

async function loadWordsearchPlayerAdapterModule() {
  const mod = await import("@/features/templates/wordsearch/player/adapter");
  return { createPlayerAdapter: mod.createPlayerAdapter };
}

async function loadWordsearchResultReviewAdapterModule() {
  return {
    createResultReviewAdapter: () => ({
      /** Shell renders common result fields; template detail is in result.templateDetail. */
      renderSummary(detail: unknown) {
        return detail;
      },
    }),
  };
}

/**
 * Wordsearch registration — scored with leaderboard.
 * Editor/player adapters load lazily from this folder only.
 * Integration lead: registry.register(createWordsearchRegistration())
 */
export function createWordsearchRegistration(): TemplateRegistration<
  WordsearchContentV1,
  WordsearchContentV1,
  WordsearchSettings
> {
  return {
    metadata: {
      key: "wordsearch",
      displayName: WORDSEARCH_COPY.templateName,
      description: WORDSEARCH_COPY.templateDescription,
      thumbnailKey: "wordsearch",
    },
    contentSupport: { family: "wordsearch", version: 1 },
    draftSchema: wordsearchContentV1Schema,
    playableSchema: wordsearchContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: wordsearchSettingsSchema,
      defaults: defaultWordsearchSettings,
      migrate: migrateWordsearchSettings,
    },
    loadEditorAdapter: loadWordsearchEditorAdapterModule,
    loadPlayerAdapter: loadWordsearchPlayerAdapterModule,
    loadResultReviewAdapter: loadWordsearchResultReviewAdapterModule,
    compatibility: createBlockedCompatibilityDetector(),
    capabilities: {
      isScored: true,
      hasLeaderboard: true,
      supportsImages: true,
      supportsAudio: true,
      supportsFullscreen: true,
    },
    templateVersion: 1,
  };
}
