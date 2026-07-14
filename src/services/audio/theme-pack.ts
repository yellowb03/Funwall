/**
 * Map activity themeKey → audio pack.
 * Themes are defined in docs/references/themes.md.
 */

import type { AudioPackId } from "@/services/audio/types";
import { isAudioPackId } from "@/services/audio/preferences";

/** Canonical theme keys from product docs → pack. */
const THEME_TO_PACK: Record<string, AudioPackId> = {
  classic: "classic",
  "tv-game-show": "gameshow",
  gameshow: "gameshow",
  "tv-gameshow": "gameshow",
  classroom: "classroom",
  "high-readability": "classroom",
  quiet: "quiet",
  calm: "quiet",
};

/**
 * Resolve an audio pack from a snapshot themeKey.
 * Unknown themes fall back to classic.
 */
export function audioPackForThemeKey(themeKey: string | undefined | null): AudioPackId {
  if (!themeKey) return "classic";
  const key = themeKey.trim().toLowerCase();
  if (isAudioPackId(key)) return key;
  return THEME_TO_PACK[key] ?? "classic";
}
