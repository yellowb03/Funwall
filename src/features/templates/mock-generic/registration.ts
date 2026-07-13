import { z } from "zod";
import {
  listContentV1PlayableSchema,
  listContentV1Schema,
} from "@/domain/content/list.v1";
import { createBlockedCompatibilityDetector } from "@/domain/conversion";
import type { TemplateRegistration } from "@/domain/template-registration";
import { loadNoopEditorAdapterModule } from "@/features/editor/mock-adapter";
import { loadNoopPlayerAdapterModule } from "@/features/player/mock-adapter";

const mockSettingsSchema = z.object({
  version: z.literal(1),
  timerMode: z.enum(["none", "countUp", "countDown"]).default("none"),
});

type MockSettings = z.infer<typeof mockSettingsSchema>;

/**
 * Internal mock/generic registration used only for registry contract tests.
 * Not one of the six product templates — registered under a separate test registry
 * when needed. The product registry never includes this key.
 *
 * Exported so tests can prove registration shape without spinning up full games.
 */
export function createMockGenericRegistration(): TemplateRegistration<
  z.infer<typeof listContentV1Schema>,
  z.infer<typeof listContentV1PlayableSchema>,
  MockSettings
> {
  return {
    metadata: {
      // Cast: mock uses wheel key only inside isolated test registries.
      key: "wheel",
      displayName: "Mock Generic",
      description: "Contract-test placeholder, not a product template.",
      thumbnailKey: "mock-generic",
    },
    contentSupport: { family: "list", version: 1 },
    draftSchema: listContentV1Schema,
    playableSchema: listContentV1PlayableSchema,
    settings: {
      version: 1,
      schema: mockSettingsSchema,
      defaults: () => ({ version: 1 as const, timerMode: "none" as const }),
    },
    loadEditorAdapter: loadNoopEditorAdapterModule,
    loadPlayerAdapter: loadNoopPlayerAdapterModule,
    compatibility: createBlockedCompatibilityDetector(),
    capabilities: {
      isScored: true,
      hasLeaderboard: true,
      supportsImages: true,
      supportsAudio: false,
      supportsFullscreen: true,
    },
    templateVersion: 1,
  };
}
