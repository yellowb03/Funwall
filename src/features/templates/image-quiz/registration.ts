import {
  imageQuizContentV1PlayableSchema,
  imageQuizContentV1Schema,
  type ImageQuizContentV1,
} from "@/domain/content/imageQuiz.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { IMAGE_QUIZ_COPY } from "@/features/templates/image-quiz/copy";
import {
  defaultImageQuizSettings,
  migrateImageQuizSettings,
  imageQuizSettingsSchema,
  type ImageQuizSettings,
} from "@/features/templates/image-quiz/settings";

export {
  defaultImageQuizSettings,
  migrateImageQuizSettings,
  imageQuizSettingsSchema,
  type ImageQuizSettings,
  type ImageQuizLayout,
  revealDurationMs,
} from "@/features/templates/image-quiz/settings";

/**
 * Lazy loaders — dynamic import keeps react-dom/client out of the server graph.
 */
async function loadImageQuizEditorAdapterModule() {
  const mod = await import("@/features/templates/image-quiz/editor/adapter");
  return { createEditorAdapter: mod.createEditorAdapter };
}

async function loadImageQuizPlayerAdapterModule() {
  const mod = await import("@/features/templates/image-quiz/player/adapter");
  return { createPlayerAdapter: mod.createPlayerAdapter };
}

async function loadImageQuizResultReviewAdapterModule() {
  const mod = await import("@/features/templates/image-quiz/review/adapter");
  return { createResultReviewAdapter: mod.createResultReviewAdapter };
}

/**
 * Image Quiz registration — scored with leaderboard.
 * Editor/player/review adapters load lazily from this folder only.
 * Integration lead wires this into the central registry.
 */
export function createImageQuizRegistration(): TemplateRegistration<
  ImageQuizContentV1,
  ImageQuizContentV1,
  ImageQuizSettings
> {
  return {
    metadata: {
      key: "image-quiz",
      displayName: IMAGE_QUIZ_COPY.templateName,
      description: IMAGE_QUIZ_COPY.templateDescription,
      thumbnailKey: "image-quiz",
    },
    contentSupport: { family: "imageQuiz", version: 1 },
    draftSchema: imageQuizContentV1Schema,
    playableSchema: imageQuizContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: imageQuizSettingsSchema,
      defaults: defaultImageQuizSettings,
      migrate: migrateImageQuizSettings,
    },
    loadEditorAdapter: loadImageQuizEditorAdapterModule,
    loadPlayerAdapter: loadImageQuizPlayerAdapterModule,
    loadResultReviewAdapter: loadImageQuizResultReviewAdapterModule,
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
