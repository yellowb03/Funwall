import {
  statementsContentV1PlayableSchema,
  statementsContentV1Schema,
  type StatementsContentV1,
} from "@/domain/content/statements.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { TRUE_FALSE_COPY } from "@/features/templates/true-false/copy";
import {
  defaultTrueFalseSettings,
  migrateTrueFalseSettings,
  trueFalseSettingsSchema,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";

export {
  defaultTrueFalseSettings,
  migrateTrueFalseSettings,
  trueFalseSettingsSchema,
  answerWindowMs,
  answerWindowTable,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";

/**
 * Lazy loaders — dynamic import keeps react-dom/client out of the server graph.
 * Registration itself is safe to import from Server Components / the central registry.
 */
async function loadTrueFalseEditorAdapterModule() {
  const mod = await import("@/features/templates/true-false/editor/adapter");
  return { createEditorAdapter: mod.createEditorAdapter };
}

async function loadTrueFalsePlayerAdapterModule() {
  const mod = await import("@/features/templates/true-false/player/adapter");
  return { createPlayerAdapter: mod.createPlayerAdapter };
}

async function loadTrueFalseResultReviewAdapterModule() {
  const mod = await import("@/features/templates/true-false/review/adapter");
  return { createResultReviewAdapter: mod.createResultReviewAdapter };
}

/**
 * True/False registration — scored with leaderboard (frozen capabilities).
 * Editor/player adapters load lazily from this folder only.
 * Integration lead wires this into the central registry.
 */
export function createTrueFalseRegistration(): TemplateRegistration<
  StatementsContentV1,
  StatementsContentV1,
  TrueFalseSettings
> {
  return {
    metadata: {
      key: "true-false",
      displayName: TRUE_FALSE_COPY.templateName,
      description: TRUE_FALSE_COPY.templateDescription,
      thumbnailKey: "true-false",
    },
    contentSupport: { family: "statements", version: 1 },
    draftSchema: statementsContentV1Schema,
    playableSchema: statementsContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: trueFalseSettingsSchema,
      defaults: defaultTrueFalseSettings,
      migrate: migrateTrueFalseSettings,
    },
    loadEditorAdapter: loadTrueFalseEditorAdapterModule,
    loadPlayerAdapter: loadTrueFalsePlayerAdapterModule,
    loadResultReviewAdapter: loadTrueFalseResultReviewAdapterModule,
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
