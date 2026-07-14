/**
 * Funwall audio service types (Workstream 10).
 * Games only see SemanticAudioEmitter; the service owns samples + buses.
 */

import type {
  SemanticAudioEventName,
  SemanticAudioParams,
} from "@/services/audio/semantic-audio";

export type AudioPackId = "classic" | "gameshow" | "classroom" | "quiet";

export type AudioBusId = "master" | "effects" | "ambience" | "voice";

export type CueConcurrencyClass =
  | "ui"
  | "tick"
  | "feedback"
  | "stinger"
  | "loop";

export interface CueDefinition {
  /** Public path under /audio/cues/ */
  src: string;
  bus?: AudioBusId;
  /** Peak gain multiplier 0–1 before intensity scaling. */
  gain?: number;
  /** Concurrency / rate-limit class. */
  class?: CueConcurrencyClass;
  /** Minimum ms between plays of this event (after intensity). */
  minIntervalMs?: number;
  /** Hard max simultaneous voices for this event. */
  maxVoices?: number;
  /** Prefer stopping older voices of same event when over max. */
  stealOldest?: boolean;
  /** When true, cancel on stopAll / dispose / route change. */
  cancellable?: boolean;
  /** Playback rate baseline (wheel ticks may multiply). */
  baseRate?: number;
  /** Optional intensity → gain curve exponent (default 1). */
  intensityExponent?: number;
}

export type CuePackMap = Record<SemanticAudioEventName, CueDefinition>;

export interface AudioServiceOptions {
  pack?: AudioPackId;
  /** 0–1 master volume. Default 0.72 classroom-safe. */
  volume?: number;
  muted?: boolean;
  /** localStorage key prefix. Pass null to disable persistence. */
  persistenceKey?: string | null;
  /** Base URL for cues (default /audio/cues). */
  cueBaseUrl?: string;
  /** Optional clock for tests. */
  now?: () => number;
  /** Inject AudioContext for tests. */
  createContext?: () => AudioContext;
  /** When true, skip real decoding (tests). */
  dryRun?: boolean;
}

export interface FunwallAudioService {
  emit(event: SemanticAudioEventName, params?: SemanticAudioParams): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  unlock(): Promise<void>;
  setVolume(volume: number): void;
  getVolume(): number;
  /** Apply pack for the current session. Pass persist:true only for explicit user choice. */
  setPack(pack: AudioPackId, options?: { persist?: boolean }): void;
  getPack(): AudioPackId;
  /** Preload selected pack (all events or subset). */
  preload(events?: readonly SemanticAudioEventName[]): Promise<void>;
  /** Stop loops and scheduled/cancellable voices. */
  stopAll(): void;
  dispose(): void;
  /** True after successful unlock (or dry-run). */
  isUnlocked(): boolean;
}
