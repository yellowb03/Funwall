import type { PublicActivitySnapshot } from "@/domain/snapshot";
import type { SessionEventEmitter } from "@/domain/session-events";
import type { SeededRng } from "@/services/rng/seeded-rng";
import type { TimerController } from "@/services/timer/clock";
import type { SemanticAudioEmitter } from "@/services/audio/semantic-audio";

/**
 * Shared player adapter contract (fake/mock surface for Wave 1).
 * @see agent-work/shared/CONTRACTS.md §6–§7
 */
export type PlayerLifecycleState =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "feedback"
  | "completed"
  | "gameOver"
  | "review";

export interface PlayerShellCommands {
  muted: boolean;
  fullscreen: boolean;
  reducedMotion: boolean;
  restartRequested: boolean;
}

export interface PlayerLifecycleCallbacks {
  onReady: () => void;
  onPauseSafeState: (state: unknown) => void;
  onComplete: (result: unknown) => void;
  onGameOver: (result: unknown) => void;
  onFatalError: (diagnosticId: string, message: string) => void;
}

export interface PlayerAdapterContext {
  snapshot: PublicActivitySnapshot;
  content: unknown;
  settings: unknown;
  themeTokens: Record<string, string>;
  rng: SeededRng;
  timer: TimerController;
  audio: SemanticAudioEmitter;
  sessionEvents: SessionEventEmitter;
  lifecycle: PlayerLifecycleCallbacks;
  commands: PlayerShellCommands;
}

/**
 * Template player adapters own the stage only.
 * They must not query the database or render owner chrome.
 */
export interface PlayerAdapter {
  mount(context: PlayerAdapterContext): void | Promise<void>;
  unmount(): void;
  pause(): void;
  resume(): void;
  restart(): void;
}
