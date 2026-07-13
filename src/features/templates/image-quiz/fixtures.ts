import type { ImageQuizContentV1 } from "@/domain/content/imageQuiz.v1";
import {
  defaultImageQuizSettings,
  type ImageQuizSettings,
} from "@/features/templates/image-quiz/settings";

/** Deterministic UUIDs for image-quiz fixtures. */
function id(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `cccccccc-dddd-4eee-8fff-${hex}`;
}

const MEDIA = {
  fox: "dddddddd-dddd-4ddd-8ddd-000000000001",
  owl: "dddddddd-dddd-4ddd-8ddd-000000000002",
  marker: "dddddddd-dddd-4ddd-8ddd-000000000003",
  compass: "dddddddd-dddd-4ddd-8ddd-000000000004",
  desk: "dddddddd-dddd-4ddd-8ddd-000000000005",
  clock: "dddddddd-dddd-4ddd-8ddd-000000000006",
  apple: "dddddddd-dddd-4ddd-8ddd-000000000007",
  broken: "dddddddd-dddd-4ddd-8ddd-00000000dead",
  deskThumb: "dddddddd-dddd-4ddd-8ddd-000000000015",
  lockerThumb: "dddddddd-dddd-4ddd-8ddd-000000000016",
  shelfThumb: "dddddddd-dddd-4ddd-8ddd-000000000017",
  sinkThumb: "dddddddd-dddd-4ddd-8ddd-000000000018",
} as const;

export interface ImageQuizFixture {
  id: string;
  title: string;
  suggestedSeed: string;
  settings: ImageQuizSettings;
  content: ImageQuizContentV1;
  notes: string;
}

export const imageQuizFixtureSmall: ImageQuizFixture = {
  id: "fixture-image-quiz-small",
  title: "Guess the animal",
  suggestedSeed: "fw-image-quiz-small-001",
  settings: {
    ...defaultImageQuizSettings(),
    revealDurationSeconds: 30,
    basePoints: 100,
    lives: null,
    shuffleQuestions: false,
    autoProceed: true,
    showAnswers: true,
    layout: "separate",
  },
  content: {
    family: "imageQuiz",
    version: 1,
    questions: [
      {
        id: id(1),
        prompt: { text: "Which animal is this?" },
        revealImageAssetId: MEDIA.fox,
        revealImageAlt: "A red fox standing in grass",
        answers: [
          { id: id(11), content: { text: "Fox" } },
          { id: id(12), content: { text: "Wolf" } },
          { id: id(13), content: { text: "Cat" } },
          { id: id(14), content: { text: "Dog" } },
        ],
        correctAnswerId: id(11),
      },
      {
        id: id(2),
        prompt: { text: "Which animal is this?" },
        revealImageAssetId: MEDIA.owl,
        revealImageAlt: "An owl perched on a branch",
        answers: [
          { id: id(21), content: { text: "Eagle" } },
          { id: id(22), content: { text: "Owl" } },
        ],
        correctAnswerId: id(22),
      },
    ],
  },
  notes: "Minimum playable with two reveal images.",
};

export const imageQuizFixtureMedium: ImageQuizFixture = {
  id: "fixture-image-quiz-medium",
  title: "Classroom objects",
  suggestedSeed: "fw-image-quiz-medium-001",
  settings: {
    ...defaultImageQuizSettings(),
    revealDurationSeconds: 20,
    basePoints: 100,
    lives: 3,
    shuffleQuestions: false,
    autoProceed: false,
    showAnswers: true,
    layout: "together",
  },
  content: {
    family: "imageQuiz",
    version: 1,
    questions: [
      {
        id: id(101),
        prompt: { text: "What is this tool used for writing on a board?" },
        revealImageAssetId: MEDIA.marker,
        revealImageAlt: "Whiteboard marker",
        answers: [
          { id: id(111), content: { text: "Marker" } },
          { id: id(112), content: { text: "Stapler" } },
          { id: id(113), content: { text: "Ruler" } },
          { id: id(114), content: { text: "Glue" } },
        ],
        correctAnswerId: id(111),
      },
      {
        id: id(102),
        prompt: { text: "Name this shape tool." },
        revealImageAssetId: MEDIA.compass,
        revealImageAlt: "Drawing compass",
        answers: [
          { id: id(121), content: { text: "Protractor" } },
          { id: id(122), content: { text: "Compass" } },
          { id: id(123), content: { text: "Calculator" } },
          { id: id(124), content: { text: "Hole punch" } },
          { id: id(125), content: { text: "Scissors" } },
          { id: id(126), content: { text: "Tape" } },
        ],
        correctAnswerId: id(122),
      },
      {
        id: id(103),
        prompt: { text: "What do students sit at?" },
        revealImageAssetId: MEDIA.desk,
        revealImageAlt: "School desk",
        answers: [
          {
            id: id(131),
            content: {
              text: "Desk",
              imageAssetId: MEDIA.deskThumb,
              imageAlt: "Desk thumbnail",
              imageFit: "cover",
            },
          },
          {
            id: id(132),
            content: {
              text: "Locker",
              imageAssetId: MEDIA.lockerThumb,
              imageAlt: "Locker thumbnail",
              imageFit: "cover",
            },
          },
          {
            id: id(133),
            content: {
              text: "Shelf",
              imageAssetId: MEDIA.shelfThumb,
              imageAlt: "Shelf thumbnail",
              imageFit: "cover",
            },
          },
          {
            id: id(134),
            content: {
              text: "Sink",
              imageAssetId: MEDIA.sinkThumb,
              imageAlt: "Sink thumbnail",
              imageFit: "cover",
            },
          },
        ],
        correctAnswerId: id(131),
      },
      {
        id: id(104),
        prompt: { text: "Which object tells time?" },
        revealImageAssetId: MEDIA.clock,
        revealImageAlt: "Analog wall clock",
        answers: [
          { id: id(141), content: { text: "Globe" } },
          { id: id(142), content: { text: "Clock" } },
        ],
        correctAnswerId: id(142),
      },
    ],
  },
  notes: "Together layout; lives; answer images; multi-answer counts.",
};

export const imageQuizFixtureStress: ImageQuizFixture = {
  id: "fixture-image-quiz-stress",
  title: "Broken image repair case",
  suggestedSeed: "fw-image-quiz-stress-001",
  settings: {
    ...defaultImageQuizSettings(),
    revealDurationSeconds: 15,
    basePoints: 100,
    lives: 2,
    shuffleQuestions: false,
    autoProceed: true,
    showAnswers: true,
    layout: "separate",
  },
  content: {
    family: "imageQuiz",
    version: 1,
    questions: [
      {
        id: id(201),
        prompt: { text: "Healthy question with valid image." },
        revealImageAssetId: MEDIA.apple,
        revealImageAlt: "Red apple",
        answers: [
          { id: id(211), content: { text: "Apple" } },
          { id: id(212), content: { text: "Orange" } },
        ],
        correctAnswerId: id(211),
      },
      {
        id: id(202),
        prompt: { text: "This reveal image is intentionally broken." },
        revealImageAssetId: MEDIA.broken,
        revealImageAlt: "Broken fixture image",
        answers: [
          { id: id(221), content: { text: "Alpha" } },
          { id: id(222), content: { text: "Beta" } },
          { id: id(223), content: { text: "Gamma" } },
          { id: id(224), content: { text: "Delta" } },
        ],
        correctAnswerId: id(221),
      },
    ],
  },
  notes: "Second question uses a missing asset id for load-error paths.",
};

export const imageQuizFixtures = {
  small: imageQuizFixtureSmall,
  medium: imageQuizFixtureMedium,
  stress: imageQuizFixtureStress,
} as const;

export { MEDIA as IMAGE_QUIZ_FIXTURE_MEDIA };
