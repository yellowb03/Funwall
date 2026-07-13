/**
 * Wordsearch template public surface.
 *
 * Safe for server imports: registration, settings, validation, generator, session.
 * Client UI adapters live under `./editor/*` and `./player/*` and are loaded
 * via `createWordsearchRegistration().loadEditorAdapter / loadPlayerAdapter`.
 *
 * Integration lead registers with:
 *   registry.register(createWordsearchRegistration())
 */
export {
  createWordsearchRegistration,
  defaultWordsearchSettings,
  migrateWordsearchSettings,
  wordsearchSettingsSchema,
  type WordsearchSettings,
  type WordsearchSelectionMode,
  type WordsearchLetterCase,
  type WordsearchDiacriticPolicy,
} from "@/features/templates/wordsearch/registration";

export {
  validateWordsearchDraft,
  validateWordsearchPlayable,
  isWordsearchPlayable,
  WORDSEARCH_LIMITS,
  WORDSEARCH_MIN_WORDS,
  WORDSEARCH_MAX_WORDS,
  WORDSEARCH_WARN_WORD_COUNT,
} from "@/features/templates/wordsearch/validation";

export {
  generateWordsearch,
  generateFromContent,
  prepareWordsForGeneration,
  verifyPlacementsOnGrid,
  straightLinePath,
  lettersAlongPath,
  allowedDirections,
  calculateMinGridSize,
  WORDSEARCH_GENERATOR_VERSION,
  WORDSEARCH_MIN_GRID,
  WORDSEARCH_MAX_GRID,
  type GenerateResult,
  type GenerateSuccess,
  type GenerateFailure,
  type WordPlacement,
  type GridCell,
} from "@/features/templates/wordsearch/generator";

export {
  normalizeWord,
  foldDiacritics,
  resolveNormalizedWord,
  formatLetter,
  LATIN_FILLER_ALPHABET,
} from "@/features/templates/wordsearch/normalize";

export {
  createWordsearchSession,
  beginPlaying,
  resolveSelectionLenient,
  applyFound,
  applyMiss,
  buildWordsearchResultDetail,
  computeScore,
  type WordsearchSessionState,
  type WordsearchPhase,
} from "@/features/templates/wordsearch/session";

export { wordsearchFixtures } from "@/features/templates/wordsearch/fixtures";
export { WORDSEARCH_COPY } from "@/features/templates/wordsearch/copy";

export const TEMPLATE_KEY = "wordsearch" as const;
