import {
  listContentV1PlayableSchema,
  listContentV1Schema,
  type ListContentV1,
} from "@/domain/content/list.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { WHEEL_COPY } from "@/features/templates/wheel/copy";
import {
  defaultWheelSettings,
  migrateWheelSettings,
  wheelSettingsSchema,
  type WheelSettings,
} from "@/features/templates/wheel/settings";

export {
  defaultWheelSettings,
  migrateWheelSettings,
  wheelSettingsSchema,
  type WheelSettings,
  type WheelSpinPower,
  type WheelImageDisplayPolicy,
  spinDurationMs,
  spinExtraTurns,
} from "@/features/templates/wheel/settings";

/**
 * Lazy loaders — dynamic import keeps react-dom/client out of the server graph.
 * Registration itself is safe to import from Server Components / the central registry.
 */
async function loadWheelEditorAdapterModule() {
  const mod = await import("@/features/templates/wheel/editor/adapter");
  return { createEditorAdapter: mod.createEditorAdapter };
}

async function loadWheelPlayerAdapterModule() {
  const mod = await import("@/features/templates/wheel/player/adapter");
  return { createPlayerAdapter: mod.createPlayerAdapter };
}

/**
 * Wheel registration — unscored, no leaderboard (frozen capabilities).
 * Editor/player adapters load lazily from this folder only.
 */
export function createWheelRegistration(): TemplateRegistration<
  ListContentV1,
  ListContentV1,
  WheelSettings
> {
  return {
    metadata: {
      key: "wheel",
      displayName: WHEEL_COPY.templateName,
      description: WHEEL_COPY.templateDescription,
      thumbnailKey: "wheel",
    },
    contentSupport: { family: "list", version: 1 },
    draftSchema: listContentV1Schema,
    playableSchema: listContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: wheelSettingsSchema,
      defaults: defaultWheelSettings,
      migrate: migrateWheelSettings,
    },
    loadEditorAdapter: loadWheelEditorAdapterModule,
    loadPlayerAdapter: loadWheelPlayerAdapterModule,
    compatibility: createBlockedCompatibilityDetector(),
    capabilities: {
      isScored: false,
      hasLeaderboard: false,
      supportsImages: true,
      supportsAudio: true,
      supportsFullscreen: true,
    },
    templateVersion: 1,
  };
}
