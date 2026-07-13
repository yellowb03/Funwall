import { z } from "zod";

/**
 * Wheel settings v1.
 * @see FUNWALL_MASTER_PLAN.md §8.1
 * @see agent-work/04-spin-wheel/TASK.md
 */

export const wheelSpinPowerSchema = z.enum(["low", "medium", "high"]);
export type WheelSpinPower = z.infer<typeof wheelSpinPowerSchema>;

export const wheelImageDisplayPolicySchema = z.enum([
  /** Show images on segments when segment arc is large enough; always in result. */
  "auto",
  /** Always attempt to show images on segments. */
  "always",
  /** Never show images on segments; result panel only. */
  "resultOnly",
]);
export type WheelImageDisplayPolicy = z.infer<
  typeof wheelImageDisplayPolicySchema
>;

export const wheelSettingsSchema = z.object({
  version: z.literal(1),
  timerMode: z.enum(["none", "countUp", "countDown"]).default("none"),
  timerSeconds: z.number().int().min(0).max(3600).optional(),
  spinPower: wheelSpinPowerSchema.default("medium"),
  shuffleItemOrder: z.boolean().default(false),
  allowEliminate: z.boolean().default(true),
  imageDisplayPolicy: wheelImageDisplayPolicySchema.default("auto"),
});

export type WheelSettings = z.infer<typeof wheelSettingsSchema>;

/** Pure, deterministic template defaults. */
export function defaultWheelSettings(): WheelSettings {
  return {
    version: 1,
    timerMode: "none",
    spinPower: "medium",
    shuffleItemOrder: false,
    allowEliminate: true,
    imageDisplayPolicy: "auto",
  };
}

/**
 * Spin duration (ms) by power. Master plan: 4–7 seconds.
 */
export function spinDurationMs(power: WheelSpinPower): number {
  switch (power) {
    case "low":
      return 4000;
    case "medium":
      return 5500;
    case "high":
      return 7000;
    default: {
      const _exhaustive: never = power;
      return _exhaustive;
    }
  }
}

/**
 * Extra full rotations for visual drama (deterministic band midpoints).
 * Winner target is computed separately; these only add full turns.
 */
export function spinExtraTurns(power: WheelSpinPower): number {
  switch (power) {
    case "low":
      return 3;
    case "medium":
      return 5;
    case "high":
      return 7;
    default: {
      const _exhaustive: never = power;
      return _exhaustive;
    }
  }
}

/**
 * Migrate provisional / product-fixture settings shapes into WheelSettings v1.
 * Accepts current v1 objects, older stub objects, and narrative fixture keys.
 *
 * Note: Zod strips unknown keys and applies defaults, so provisional aliases
 * (`timer`, `shuffleItems`) must be normalized *before* schema parse.
 */
export function migrateWheelSettings(
  fromVersion: number,
  raw: unknown,
): WheelSettings {
  const defaults = defaultWheelSettings();

  if (raw === null || raw === undefined || typeof raw !== "object") {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  // Narrative fixture / provisional aliases → canonical keys
  const timerRaw = obj.timerMode ?? obj.timer;
  let timerMode: WheelSettings["timerMode"] = defaults.timerMode;
  if (timerRaw === "none" || timerRaw === "countUp" || timerRaw === "countDown") {
    timerMode = timerRaw;
  }

  const spinRaw = obj.spinPower;
  let spinPower: WheelSpinPower = defaults.spinPower;
  if (spinRaw === "low" || spinRaw === "medium" || spinRaw === "high") {
    spinPower = spinRaw;
  }

  const shuffle =
    typeof obj.shuffleItemOrder === "boolean"
      ? obj.shuffleItemOrder
      : typeof obj.shuffleItems === "boolean"
        ? obj.shuffleItems
        : defaults.shuffleItemOrder;

  const allowEliminate =
    typeof obj.allowEliminate === "boolean"
      ? obj.allowEliminate
      : defaults.allowEliminate;

  let imageDisplayPolicy: WheelImageDisplayPolicy = defaults.imageDisplayPolicy;
  if (
    obj.imageDisplayPolicy === "auto" ||
    obj.imageDisplayPolicy === "always" ||
    obj.imageDisplayPolicy === "resultOnly"
  ) {
    imageDisplayPolicy = obj.imageDisplayPolicy;
  }

  let timerSeconds: number | undefined;
  if (typeof obj.timerSeconds === "number" && Number.isFinite(obj.timerSeconds)) {
    timerSeconds = Math.max(0, Math.min(3600, Math.floor(obj.timerSeconds)));
  }

  const migrated = {
    version: 1 as const,
    timerMode,
    ...(timerSeconds !== undefined ? { timerSeconds } : {}),
    spinPower,
    shuffleItemOrder: shuffle,
    allowEliminate,
    imageDisplayPolicy,
  };

  // fromVersion reserved for future multi-version migrations
  void fromVersion;

  const parsed = wheelSettingsSchema.safeParse(migrated);
  return parsed.success ? parsed.data : defaults;
}
