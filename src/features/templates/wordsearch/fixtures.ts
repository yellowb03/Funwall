import type { WordsearchContentV1 } from "@/domain/content/wordsearch.v1";
import {
  defaultWordsearchSettings,
  type WordsearchSettings,
} from "@/features/templates/wordsearch/settings";

/** Deterministic UUIDs for wordsearch fixtures. */
function id(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `cccccccc-dddd-4eee-8fff-${hex}`;
}

export interface WordsearchFixture {
  id: string;
  title: string;
  suggestedSeed: string;
  settings: WordsearchSettings;
  content: WordsearchContentV1;
  notes: string;
}

export const wordsearchFixtureSmall: WordsearchFixture = {
  id: "fixture-wordsearch-small",
  title: "Farm animals",
  suggestedSeed: "fw-wordsearch-small-001",
  settings: {
    ...defaultWordsearchSettings(),
    timerMode: "none",
    lives: null,
    selectionMode: "drag",
    showWordList: true,
    allowDiagonal: false,
    allowReverse: false,
    letterCase: "upper",
    showAnswersAtEnd: true,
  },
  content: {
    family: "wordsearch",
    version: 1,
    words: [
      { id: id(1), displayWord: "COW", normalizedWord: "COW" },
      { id: id(2), displayWord: "PIG", normalizedWord: "PIG" },
      { id: id(3), displayWord: "HEN", normalizedWord: "HEN" },
      { id: id(4), displayWord: "GOAT", normalizedWord: "GOAT" },
      { id: id(5), displayWord: "SHEEP", normalizedWord: "SHEEP" },
      { id: id(6), displayWord: "HORSE", normalizedWord: "HORSE" },
    ],
  },
  notes: "Words only; no diagonal/reverse.",
};

export const wordsearchFixtureMedium: WordsearchFixture = {
  id: "fixture-wordsearch-medium",
  title: "Weather words with clues",
  suggestedSeed: "fw-wordsearch-medium-001",
  settings: {
    ...defaultWordsearchSettings(),
    timerMode: "countDown",
    timerSeconds: 180,
    lives: 3,
    selectionMode: "tapFirst",
    showWordList: false,
    allowDiagonal: true,
    allowReverse: true,
    letterCase: "upper",
    showAnswersAtEnd: true,
  },
  content: {
    family: "wordsearch",
    version: 1,
    words: [
      {
        id: id(101),
        displayWord: "RAIN",
        normalizedWord: "RAIN",
        clue: { text: "Drops of water from clouds" },
      },
      {
        id: id(102),
        displayWord: "SNOW",
        normalizedWord: "SNOW",
        clue: { text: "Soft white flakes in winter" },
      },
      {
        id: id(103),
        displayWord: "WIND",
        normalizedWord: "WIND",
        clue: { text: "Moving air you can feel" },
      },
      {
        id: id(104),
        displayWord: "CLOUD",
        normalizedWord: "CLOUD",
        clue: {
          text: "Fluffy shapes in the sky",
          imageAssetId: "bbbbbbbb-bbbb-4bbb-8bbb-000000000010",
          imageAlt: "White cloud on blue sky",
          imageFit: "cover",
        },
      },
      {
        id: id(105),
        displayWord: "STORM",
        normalizedWord: "STORM",
        clue: { text: "Strong weather with rain and wind" },
      },
      {
        id: id(106),
        displayWord: "SUNNY",
        normalizedWord: "SUNNY",
        clue: { text: "Bright day with clear skies" },
      },
      {
        id: id(107),
        displayWord: "FOG",
        normalizedWord: "FOG",
        clue: { text: "Thick mist that is hard to see through" },
      },
      {
        id: id(108),
        displayWord: "HAIL",
        normalizedWord: "HAIL",
        clue: { text: "Ice pellets that fall from the sky" },
      },
    ],
  },
  notes: "Clues, diagonal, reverse; list hidden.",
};

export const wordsearchFixtureMin: WordsearchFixture = {
  id: "fixture-wordsearch-min",
  title: "Two words",
  suggestedSeed: "fw-wordsearch-min-001",
  settings: defaultWordsearchSettings(),
  content: {
    family: "wordsearch",
    version: 1,
    words: [
      { id: id(201), displayWord: "CAT", normalizedWord: "CAT" },
      { id: id(202), displayWord: "DOG", normalizedWord: "DOG" },
    ],
  },
  notes: "Minimum playable (2 words).",
};

export const wordsearchFixtureHyphen: WordsearchFixture = {
  id: "fixture-wordsearch-hyphen",
  title: "Spaces and hyphens",
  suggestedSeed: "fw-wordsearch-hyphen-001",
  settings: {
    ...defaultWordsearchSettings(),
    allowDiagonal: true,
    allowReverse: true,
  },
  content: {
    family: "wordsearch",
    version: 1,
    words: [
      { id: id(301), displayWord: "ice cream", normalizedWord: "ICECREAM" },
      { id: id(302), displayWord: "well-known", normalizedWord: "WELLKNOWN" },
      { id: id(303), displayWord: "RAIN", normalizedWord: "RAIN" },
      { id: id(304), displayWord: "SUN", normalizedWord: "SUN" },
    ],
  },
  notes: "Display preserves separators; grid strips them.",
};

export const wordsearchFixtures = {
  small: wordsearchFixtureSmall,
  medium: wordsearchFixtureMedium,
  min: wordsearchFixtureMin,
  hyphen: wordsearchFixtureHyphen,
} as const;
