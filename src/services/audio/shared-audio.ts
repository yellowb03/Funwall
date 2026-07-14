/**
 * Process-wide browser audio singleton.
 * PlayerShell and UI chrome must share one service so mute/volume stay in sync
 * and we only open one AudioContext.
 */

import { createBrowserAudioService } from "@/services/audio/create-audio-service";
import type { FunwallAudioService } from "@/services/audio/types";

let shared: FunwallAudioService | null = null;

/**
 * Returns the shared Funwall audio service (browser).
 * Safe to call during render; construction is lazy and idempotent.
 */
export function getSharedBrowserAudio(): FunwallAudioService {
  if (!shared) {
    shared = createBrowserAudioService({
      persistenceKey: "funwall.audio",
    });
  }
  return shared;
}

/** Test-only: reset singleton between suites. */
export function __resetSharedBrowserAudioForTests(): void {
  if (shared) {
    try {
      shared.dispose();
    } catch {
      /* ignore */
    }
  }
  shared = null;
}
