/**
 * Theme audio packs → curated CC0 samples (Kenney).
 * Packs share the same cue set with alternate files and gain profiles.
 * @see docs/audio/PROVENANCE.md
 */

import type {
  AudioPackId,
  CueDefinition,
  CuePackMap,
} from "@/services/audio/types";
import type { SemanticAudioEventName } from "@/services/audio/semantic-audio";
import { SEMANTIC_AUDIO_EVENTS } from "@/services/audio/semantic-audio";

const CUE = (file: string, partial: Omit<CueDefinition, "src"> = {}): CueDefinition => ({
  src: file,
  bus: "effects",
  gain: 0.7,
  class: "feedback",
  maxVoices: 2,
  stealOldest: true,
  cancellable: true,
  ...partial,
});

/** Classic classroom-bright default (pizzicato stingers + soft UI). */
const CLASSIC: CuePackMap = {
  "ui.press": CUE("ui-press.ogg", {
    gain: 0.45,
    class: "ui",
    minIntervalMs: 40,
    maxVoices: 3,
  }),
  "countdown.tick": CUE("countdown-tick.ogg", {
    gain: 0.38,
    class: "tick",
    minIntervalMs: 80,
    maxVoices: 1,
    stealOldest: true,
  }),
  "answer.correct": CUE("answer-correct.ogg", {
    gain: 0.62,
    class: "stinger",
    minIntervalMs: 120,
    maxVoices: 2,
  }),
  "answer.incorrect": CUE("answer-incorrect.ogg", {
    gain: 0.42,
    class: "feedback",
    minIntervalMs: 120,
    maxVoices: 2,
  }),
  "game.complete": CUE("game-complete.ogg", {
    gain: 0.68,
    class: "stinger",
    minIntervalMs: 400,
    maxVoices: 1,
  }),
  "game.over": CUE("game-over.ogg", {
    gain: 0.5,
    class: "stinger",
    minIntervalMs: 400,
    maxVoices: 1,
  }),
  "wheel.tick": CUE("wheel-tick.ogg", {
    gain: 0.28,
    class: "tick",
    minIntervalMs: 18,
    maxVoices: 4,
    baseRate: 1,
  }),
  "wheel.selected": CUE("wheel-selected.ogg", {
    gain: 0.7,
    class: "stinger",
    minIntervalMs: 200,
    maxVoices: 1,
  }),
  "pairs.flip": CUE("pairs-flip.ogg", {
    gain: 0.48,
    class: "ui",
    minIntervalMs: 50,
    maxVoices: 3,
  }),
  "pairs.match": CUE("pairs-match.ogg", {
    gain: 0.6,
    class: "stinger",
    minIntervalMs: 100,
    maxVoices: 2,
  }),
  "pairs.miss": CUE("pairs-miss.ogg", {
    gain: 0.4,
    class: "feedback",
    minIntervalMs: 100,
    maxVoices: 2,
  }),
  "gameshow.lifeline": CUE("gameshow-lifeline.ogg", {
    gain: 0.55,
    class: "stinger",
    minIntervalMs: 200,
    maxVoices: 1,
  }),
  "gameshow.bonusStart": CUE("gameshow-bonus-start.ogg", {
    gain: 0.5,
    class: "loop",
    minIntervalMs: 0,
    maxVoices: 1,
    stealOldest: true,
  }),
  "gameshow.bonusReward": CUE("gameshow-bonus-reward.ogg", {
    gain: 0.72,
    class: "stinger",
    minIntervalMs: 300,
    maxVoices: 1,
  }),
  "wordsearch.trace": CUE("wordsearch-trace.ogg", {
    gain: 0.22,
    class: "tick",
    minIntervalMs: 45,
    maxVoices: 2,
  }),
  "wordsearch.found": CUE("wordsearch-found.ogg", {
    gain: 0.58,
    class: "stinger",
    minIntervalMs: 120,
    maxVoices: 2,
  }),
  "imageQuiz.reveal": CUE("image-reveal.ogg", {
    gain: 0.14,
    class: "tick",
    minIntervalMs: 70,
    maxVoices: 2,
  }),
  "imageQuiz.buzzer": CUE("image-buzzer.ogg", {
    gain: 0.55,
    class: "feedback",
    minIntervalMs: 100,
    maxVoices: 1,
  }),
  "trueFalse.enter": CUE("truefalse-enter.ogg", {
    gain: 0.42,
    class: "ui",
    minIntervalMs: 80,
    maxVoices: 2,
  }),
  "trueFalse.resolve": CUE("truefalse-resolve.ogg", {
    gain: 0.48,
    class: "feedback",
    minIntervalMs: 100,
    maxVoices: 2,
  }),
};

function scalePack(
  base: CuePackMap,
  gainMul: number,
  overrides?: Partial<Record<SemanticAudioEventName, Partial<CueDefinition> & { src?: string }>>,
): CuePackMap {
  const out = {} as CuePackMap;
  for (const event of SEMANTIC_AUDIO_EVENTS) {
    const srcDef = base[event];
    const o = overrides?.[event];
    out[event] = {
      ...srcDef,
      ...o,
      gain: (o?.gain ?? srcDef.gain ?? 0.7) * gainMul,
      src: o?.src ?? srcDef.src,
    };
  }
  return out;
}

/** Punchier gameshow energy — steel jingles + slightly hotter ticks. */
const GAMESHOW = scalePack(CLASSIC, 1.05, {
  "answer.correct": { src: "answer-correct-gameshow.ogg", gain: 0.68 },
  "game.complete": { src: "game-complete-gameshow.ogg", gain: 0.74 },
  "wheel.selected": { src: "wheel-selected-impact.ogg", gain: 0.72 },
  "imageQuiz.buzzer": { gain: 0.62 },
  "gameshow.bonusReward": { gain: 0.78 },
  "countdown.tick": { src: "countdown-urgent.ogg", gain: 0.42 },
});

/** Soft organic classroom — quieter peaks, plucks over brass. */
const CLASSROOM = scalePack(CLASSIC, 0.82, {
  "ui.press": { src: "ui-press-soft.ogg", gain: 0.4 },
  "answer.correct": { src: "answer-correct-soft.ogg", gain: 0.55 },
  "game.complete": { src: "game-complete-soft.ogg", gain: 0.58 },
  "pairs.flip": { src: "pairs-flip-soft.ogg", gain: 0.45 },
  "wheel.tick": { gain: 0.22 },
  "imageQuiz.reveal": { gain: 0.1 },
  "answer.incorrect": { gain: 0.34 },
});

/** Quiet theme — softest pack for calm mode / sensitive rooms. */
const QUIET = scalePack(CLASSROOM, 0.72, {
  "ui.press": { gain: 0.32 },
  "wheel.tick": { gain: 0.16 },
  "imageQuiz.reveal": { gain: 0.08 },
  "wordsearch.trace": { gain: 0.14 },
  "countdown.tick": { src: "countdown-soft.ogg", gain: 0.28 },
  "game.complete": { gain: 0.48 },
  "answer.correct": { gain: 0.45 },
});

export const AUDIO_PACKS: Record<AudioPackId, CuePackMap> = {
  classic: CLASSIC,
  gameshow: GAMESHOW,
  classroom: CLASSROOM,
  quiet: QUIET,
};

export const DEFAULT_AUDIO_PACK: AudioPackId = "classic";

export function getCueDefinition(
  pack: AudioPackId,
  event: SemanticAudioEventName,
): CueDefinition {
  return AUDIO_PACKS[pack][event] ?? AUDIO_PACKS.classic[event];
}

export function listPackCueFiles(pack: AudioPackId): string[] {
  const map = AUDIO_PACKS[pack];
  const files = new Set<string>();
  for (const event of SEMANTIC_AUDIO_EVENTS) {
    files.add(map[event].src);
  }
  return [...files];
}

/**
 * Countdown urgency: when intensity ≥ 0.85, classic/gameshow switch to urgent tick file.
 * Implemented at emit-time so packs stay simple.
 */
export function resolveCountdownCue(
  pack: AudioPackId,
  intensity: number,
): CueDefinition {
  const base = getCueDefinition(pack, "countdown.tick");
  if (intensity >= 0.85 && pack !== "quiet" && pack !== "classroom") {
    return {
      ...base,
      src: "countdown-urgent.ogg",
      gain: (base.gain ?? 0.38) * 1.08,
    };
  }
  return base;
}
