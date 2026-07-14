/**
 * Per-template cue subsets for targeted preload.
 * Full pack files still available via getCueDefinition; this only reduces network work.
 */

import type { SemanticAudioEventName } from "@/services/audio/semantic-audio";

/** Shared shell + feedback cues every player needs. */
const SHARED: readonly SemanticAudioEventName[] = [
  "ui.press",
  "answer.correct",
  "answer.incorrect",
  "game.complete",
  "game.over",
  "countdown.tick",
];

const BY_TEMPLATE: Record<string, readonly SemanticAudioEventName[]> = {
  wheel: [...SHARED, "wheel.tick", "wheel.selected"],
  wordsearch: [...SHARED, "wordsearch.trace", "wordsearch.found"],
  "image-quiz": [...SHARED, "imageQuiz.reveal", "imageQuiz.buzzer"],
  "true-false": [...SHARED, "trueFalse.enter", "trueFalse.resolve"],
  "matching-pairs": [...SHARED, "pairs.flip", "pairs.match", "pairs.miss"],
  "gameshow-quiz": [
    ...SHARED,
    "gameshow.lifeline",
    "gameshow.bonusStart",
    "gameshow.bonusReward",
  ],
};

/**
 * Events to preload for a template key. Unknown keys → full shared + common set.
 */
export function cuesForTemplate(
  templateKey: string | undefined | null,
): readonly SemanticAudioEventName[] {
  if (!templateKey) return SHARED;
  return BY_TEMPLATE[templateKey] ?? SHARED;
}
