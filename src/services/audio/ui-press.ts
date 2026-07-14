/**
 * Lightweight shared UI press helper for owner chrome and CTAs.
 * Uses the same singleton as PlayerShell so mute/volume stay in sync.
 */

import { getSharedBrowserAudio } from "@/services/audio/shared-audio";

/**
 * Soft click for buttons/links after a user gesture.
 * Unlocks on first call; no-ops when muted or SSR.
 */
export async function playUiPress(intensity = 0.55): Promise<void> {
  if (typeof window === "undefined") return;
  const audio = getSharedBrowserAudio();
  // Re-check mute every call (player HUD may have toggled the shared service).
  if (audio.isMuted()) return;
  try {
    await audio.unlock();
  } catch {
    return;
  }
  if (audio.isMuted()) return;
  audio.emit("ui.press", { intensity });
}
