/**
 * Mute / volume / pack persistence for the player shell.
 * Owner profile integration can later supersede localStorage for signed-in owners.
 */

import type { AudioPackId } from "@/services/audio/types";

export const AUDIO_PREF_KEYS = {
  muted: "funwall.audio.muted",
  volume: "funwall.audio.volume",
  pack: "funwall.audio.pack",
} as const;

const PACKS: readonly AudioPackId[] = [
  "classic",
  "gameshow",
  "classroom",
  "quiet",
];

export interface AudioPreferences {
  muted: boolean;
  volume: number;
  pack: AudioPackId;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  muted: false,
  volume: 0.72,
  pack: "classic",
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_AUDIO_PREFERENCES.volume;
  return Math.min(1, Math.max(0, value));
}

export function isAudioPackId(value: string): value is AudioPackId {
  return (PACKS as readonly string[]).includes(value);
}

export function loadAudioPreferences(
  keyPrefix: string | null = "funwall.audio",
): AudioPreferences {
  if (!keyPrefix || !canUseStorage()) {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }

  try {
    const mutedRaw = localStorage.getItem(`${keyPrefix}.muted`);
    const volumeRaw = localStorage.getItem(`${keyPrefix}.volume`);
    const packRaw = localStorage.getItem(`${keyPrefix}.pack`);

    return {
      muted: mutedRaw === "1" || mutedRaw === "true",
      volume:
        volumeRaw == null
          ? DEFAULT_AUDIO_PREFERENCES.volume
          : clampVolume(Number(volumeRaw)),
      pack:
        packRaw && isAudioPackId(packRaw)
          ? packRaw
          : DEFAULT_AUDIO_PREFERENCES.pack,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }
}

export function saveAudioPreferences(
  prefs: Partial<AudioPreferences>,
  keyPrefix: string | null = "funwall.audio",
): void {
  if (!keyPrefix || !canUseStorage()) return;

  try {
    if (prefs.muted !== undefined) {
      localStorage.setItem(
        `${keyPrefix}.muted`,
        prefs.muted ? "true" : "false",
      );
    }
    if (prefs.volume !== undefined) {
      localStorage.setItem(
        `${keyPrefix}.volume`,
        String(clampVolume(prefs.volume)),
      );
    }
    if (prefs.pack !== undefined && isAudioPackId(prefs.pack)) {
      localStorage.setItem(`${keyPrefix}.pack`, prefs.pack);
    }
  } catch {
    /* private mode / quota — ignore */
  }
}
