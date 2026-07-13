import type {
  ImageQuizContentV1,
  ListContentV1,
  PairsContentV1,
  QuizContentV1,
  StatementsContentV1,
  WordsearchContentV1,
} from "@/domain/content";

/** Stable classroom fixture IDs (deterministic UUIDs for tests). */
export const FIXTURE_IDS = {
  list: {
    item1: "11111111-1111-4111-8111-111111111111",
    item2: "11111111-1111-4111-8111-111111111112",
    item3: "11111111-1111-4111-8111-111111111113",
  },
  pairs: {
    pair1: "22222222-2222-4222-8222-222222222221",
    pair2: "22222222-2222-4222-8222-222222222222",
  },
  quiz: {
    question1: "33333333-3333-4333-8333-333333333331",
    answer1: "33333333-3333-4333-8333-3333333333a1",
    answer2: "33333333-3333-4333-8333-3333333333a2",
    answer3: "33333333-3333-4333-8333-3333333333a3",
  },
  wordsearch: {
    word1: "44444444-4444-4444-8444-444444444441",
    word2: "44444444-4444-4444-8444-444444444442",
  },
  imageQuiz: {
    question1: "55555555-5555-4555-8555-555555555551",
    answer1: "55555555-5555-4555-8555-5555555555a1",
    answer2: "55555555-5555-4555-8555-5555555555a2",
    reveal: "55555555-5555-4555-8555-5555555555b1",
  },
  statements: {
    s1: "66666666-6666-4666-8666-666666666661",
    s2: "66666666-6666-4666-8666-666666666662",
  },
} as const;

export function buildListContent(
  overrides?: Partial<ListContentV1>,
): ListContentV1 {
  return {
    family: "list",
    version: 1,
    instruction: "Name a classroom supply",
    items: [
      { id: FIXTURE_IDS.list.item1, content: { text: "Pencil" } },
      { id: FIXTURE_IDS.list.item2, content: { text: "Eraser" } },
      { id: FIXTURE_IDS.list.item3, content: { text: "Ruler" } },
    ],
    ...overrides,
  };
}

export function buildPairsContent(
  overrides?: Partial<PairsContentV1>,
): PairsContentV1 {
  return {
    family: "pairs",
    version: 1,
    pairMode: "related",
    pairs: [
      {
        id: FIXTURE_IDS.pairs.pair1,
        left: { text: "Hot" },
        right: { text: "Cold" },
      },
      {
        id: FIXTURE_IDS.pairs.pair2,
        left: { text: "Day" },
        right: { text: "Night" },
      },
    ],
    ...overrides,
  };
}

export function buildQuizContent(
  overrides?: Partial<QuizContentV1>,
): QuizContentV1 {
  return {
    family: "quiz",
    version: 1,
    questions: [
      {
        id: FIXTURE_IDS.quiz.question1,
        prompt: { text: "How many continents are there?" },
        answers: [
          { id: FIXTURE_IDS.quiz.answer1, content: { text: "5" } },
          { id: FIXTURE_IDS.quiz.answer2, content: { text: "7" } },
          { id: FIXTURE_IDS.quiz.answer3, content: { text: "9" } },
        ],
        correctAnswerId: FIXTURE_IDS.quiz.answer2,
      },
    ],
    ...overrides,
  };
}

export function buildWordsearchContent(
  overrides?: Partial<WordsearchContentV1>,
): WordsearchContentV1 {
  return {
    family: "wordsearch",
    version: 1,
    words: [
      {
        id: FIXTURE_IDS.wordsearch.word1,
        displayWord: "Apple",
        normalizedWord: "APPLE",
        clue: { text: "A red fruit" },
      },
      {
        id: FIXTURE_IDS.wordsearch.word2,
        displayWord: "Book",
        normalizedWord: "BOOK",
        clue: { text: "You read it" },
      },
    ],
    ...overrides,
  };
}

export function buildImageQuizContent(
  overrides?: Partial<ImageQuizContentV1>,
): ImageQuizContentV1 {
  return {
    family: "imageQuiz",
    version: 1,
    questions: [
      {
        id: FIXTURE_IDS.imageQuiz.question1,
        prompt: { text: "What animal is this?" },
        revealImageAssetId: FIXTURE_IDS.imageQuiz.reveal,
        revealImageAlt: "A striped orange cat",
        answers: [
          { id: FIXTURE_IDS.imageQuiz.answer1, content: { text: "Dog" } },
          { id: FIXTURE_IDS.imageQuiz.answer2, content: { text: "Cat" } },
        ],
        correctAnswerId: FIXTURE_IDS.imageQuiz.answer2,
      },
    ],
    ...overrides,
  };
}

export function buildStatementsContent(
  overrides?: Partial<StatementsContentV1>,
): StatementsContentV1 {
  return {
    family: "statements",
    version: 1,
    statements: [
      {
        id: FIXTURE_IDS.statements.s1,
        content: { text: "The sun rises in the east." },
        isTrue: true,
      },
      {
        id: FIXTURE_IDS.statements.s2,
        content: { text: "Fish can fly." },
        isTrue: false,
      },
    ],
    ...overrides,
  };
}
