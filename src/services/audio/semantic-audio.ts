/**
 * Semantic audio emitter interface.
 * Games emit named events; they do not play files directly.
 * @see agent-work/shared/CONTRACTS.md §12
 */

export const SEMANTIC_AUDIO_EVENTS = [
  "ui.press",
  "countdown.tick",
  "answer.correct",
  "answer.incorrect",
  "game.complete",
  "game.over",
  "wheel.tick",
  "wheel.selected",
  "pairs.flip",
  "pairs.match",
  "pairs.miss",
  "gameshow.lifeline",
  "gameshow.bonusStart",
  "gameshow.bonusReward",
  "wordsearch.trace",
  "wordsearch.found",
  "imageQuiz.reveal",
  "imageQuiz.buzzer",
  "trueFalse.enter",
  "trueFalse.resolve",
] as const;

export type SemanticAudioEventName = (typeof SEMANTIC_AUDIO_EVENTS)[number];

export interface SemanticAudioParams {
  /** 0-1 intensity hint for the audio service. */
  intensity?: number;
  /** Playback rate multiplier (e.g. wheel speed). */
  rate?: number;
}

export interface SemanticAudioEmitter {
  emit(event: SemanticAudioEventName, params?: SemanticAudioParams): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Call after first user gesture to unlock browser audio. */
  unlock(): Promise<void>;
}

/**
 * No-op audio emitter for tests and scaffolds before Workstream 10.
 * Records events when `record` is true for assertions.
 */
export function createNoopAudioEmitter(options?: {
  record?: boolean;
}): SemanticAudioEmitter & {
  events: Array<{ event: SemanticAudioEventName; params?: SemanticAudioParams }>;
} {
  let muted = false;
  const events: Array<{
    event: SemanticAudioEventName;
    params?: SemanticAudioParams;
  }> = [];

  return {
    events,
    emit(event, params) {
      if (options?.record) {
        events.push({ event, params });
      }
    },
    setMuted(value) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
    async unlock() {
      /* no-op */
    },
  };
}

export function isSemanticAudioEvent(
  value: string,
): value is SemanticAudioEventName {
  return (SEMANTIC_AUDIO_EVENTS as readonly string[]).includes(value);
}
