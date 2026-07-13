import type { z } from "zod";
import type { ContentFamily } from "@/domain/content";
import type { SettingsBase, SettingsContract } from "@/domain/settings";
import type { TemplateKey } from "@/domain/template-keys";
import type { CompatibilityDetector } from "@/domain/conversion";

/**
 * Template registration contract matching CONTRACTS.md §5 / master plan §6.3.
 * Activity agents export a registration factory from their folder.
 * They do not edit the central registry.
 */
export interface TemplateCapabilities {
  isScored: boolean;
  hasLeaderboard: boolean;
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsFullscreen: boolean;
}

export interface TemplateMetadata {
  key: TemplateKey;
  displayName: string;
  description: string;
  /** Path or key for original (clean-room) thumbnail art. */
  thumbnailKey: string;
}

export interface ContentFamilySupport {
  family: ContentFamily;
  version: number;
}

/**
 * Lazy loader hooks — adapters are loaded only when the template is selected.
 * Implementations return module factories so the public bundle can code-split.
 */
export type LazyEditorAdapterLoader = () => Promise<{
  createEditorAdapter: (...args: unknown[]) => unknown;
}>;

export type LazyPlayerAdapterLoader = () => Promise<{
  createPlayerAdapter: (...args: unknown[]) => unknown;
}>;

export type LazyResultReviewAdapterLoader = () => Promise<{
  createResultReviewAdapter: (...args: unknown[]) => unknown;
}>;

export interface TemplateRegistration<
  TDraft = unknown,
  TPlayable = unknown,
  TSettings extends SettingsBase = SettingsBase,
> {
  metadata: TemplateMetadata;
  contentSupport: ContentFamilySupport;
  draftSchema: z.ZodType<TDraft>;
  playableSchema: z.ZodType<TPlayable>;
  settings: SettingsContract<TSettings>;
  loadEditorAdapter: LazyEditorAdapterLoader;
  loadPlayerAdapter: LazyPlayerAdapterLoader;
  /** Required when isScored is true; optional for Wheel. */
  loadResultReviewAdapter?: LazyResultReviewAdapterLoader;
  compatibility: CompatibilityDetector;
  capabilities: TemplateCapabilities;
  templateVersion: number;
}

export type AnyTemplateRegistration = TemplateRegistration<
  unknown,
  unknown,
  SettingsBase
>;
