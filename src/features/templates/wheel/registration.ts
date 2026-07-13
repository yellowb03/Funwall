import { z } from "zod";
import {
  listContentV1PlayableSchema,
  listContentV1Schema,
} from "@/domain/content/list.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { loadNoopEditorAdapterModule } from "@/features/editor/mock-adapter";
import { loadNoopPlayerAdapterModule } from "@/features/player/mock-adapter";

/**
 * Wheel settings stub — Workstream 04 completes real options.
 */
export const wheelSettingsSchema = z.object({
  version: z.literal(1),
  timerMode: z.enum(["none", "countUp", "countDown"]).default("none"),
  timerSeconds: z.number().int().min(0).max(3600).optional(),
  spinPower: z.enum(["low", "medium", "high"]).default("medium"),
  shuffleItemOrder: z.boolean().default(false),
});

export type WheelSettings = z.infer<typeof wheelSettingsSchema>;

export function defaultWheelSettings(): WheelSettings {
  return {
    version: 1,
    timerMode: "none",
    spinPower: "medium",
    shuffleItemOrder: false,
  };
}

/**
 * Wheel registration stub.
 * Workstream 04 completes editor/player adapters inside this folder.
 * Capabilities are frozen: unscored, no leaderboard.
 */
export function createWheelRegistration(): TemplateRegistration<
  z.infer<typeof listContentV1Schema>,
  z.infer<typeof listContentV1PlayableSchema>,
  WheelSettings
> {
  return {
    metadata: {
      key: "wheel",
      displayName: "Spin the wheel",
      description: "Spin a colorful wheel to pick a random item from your list.",
      thumbnailKey: "wheel",
    },
    contentSupport: { family: "list", version: 1 },
    draftSchema: listContentV1Schema,
    playableSchema: listContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: wheelSettingsSchema,
      defaults: defaultWheelSettings,
    },
    loadEditorAdapter: loadNoopEditorAdapterModule,
    loadPlayerAdapter: loadNoopPlayerAdapterModule,
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
