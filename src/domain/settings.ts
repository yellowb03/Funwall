import { z } from "zod";

/**
 * Settings base contract.
 * Every template settings object has a `version`.
 * @see agent-work/shared/CONTRACTS.md §16
 */
export const settingsBaseSchema = z.object({
  version: z.number().int().positive(),
});

export type SettingsBase = z.infer<typeof settingsBaseSchema>;

/** Shared timer mode used across templates. */
export const timerModeSchema = z.enum(["none", "countUp", "countDown"]);
export type TimerMode = z.infer<typeof timerModeSchema>;

/**
 * Common optional settings keys many templates share.
 * Template-specific settings extend this shape with their own version.
 */
export const commonGameplaySettingsSchema = settingsBaseSchema.extend({
  timerMode: timerModeSchema.default("none"),
  timerSeconds: z.number().int().min(0).max(3600).optional(),
});

export type CommonGameplaySettings = z.infer<
  typeof commonGameplaySettingsSchema
>;

export type SettingsMigration<TSettings> = (
  fromVersion: number,
  raw: unknown,
) => TSettings;

export interface SettingsContract<TSettings extends SettingsBase> {
  version: number;
  schema: z.ZodType<TSettings>;
  defaults: () => TSettings;
  migrate?: SettingsMigration<TSettings>;
}
