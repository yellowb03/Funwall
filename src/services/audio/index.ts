export {
  SEMANTIC_AUDIO_EVENTS,
  createNoopAudioEmitter,
  isSemanticAudioEvent,
  type SemanticAudioEventName,
  type SemanticAudioParams,
  type SemanticAudioEmitter,
} from "@/services/audio/semantic-audio";

export {
  createFunwallAudioService,
  createBrowserAudioService,
} from "@/services/audio/create-audio-service";

export {
  AUDIO_PACKS,
  DEFAULT_AUDIO_PACK,
  getCueDefinition,
  listPackCueFiles,
  resolveCountdownCue,
} from "@/services/audio/cue-packs";

export {
  AUDIO_PREF_KEYS,
  DEFAULT_AUDIO_PREFERENCES,
  clampVolume,
  isAudioPackId,
  loadAudioPreferences,
  saveAudioPreferences,
  type AudioPreferences,
} from "@/services/audio/preferences";

export type {
  AudioPackId,
  AudioBusId,
  CueDefinition,
  CuePackMap,
  CueConcurrencyClass,
  AudioServiceOptions,
  FunwallAudioService,
} from "@/services/audio/types";

export { audioPackForThemeKey } from "@/services/audio/theme-pack";

export { playUiPress } from "@/services/audio/ui-press";

export {
  getSharedBrowserAudio,
  __resetSharedBrowserAudioForTests,
} from "@/services/audio/shared-audio";

export { cuesForTemplate } from "@/services/audio/template-cues";
