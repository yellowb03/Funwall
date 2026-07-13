import type { StatementsContentV1 } from "@/domain/content/statements.v1";
import {
  defaultTrueFalseSettings,
  type TrueFalseSettings,
} from "@/features/templates/true-false/settings";

/** Deterministic UUIDs for true-false fixtures. */
function id(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `cccccccc-dddd-4eee-8fff-${hex}`;
}

export interface TrueFalseFixture {
  id: string;
  title: string;
  suggestedSeed: string;
  settings: TrueFalseSettings;
  content: StatementsContentV1;
  notes: string;
}

export const trueFalseFixtureSmall: TrueFalseFixture = {
  id: "fixture-true-false-small",
  title: "Earth facts (balanced)",
  suggestedSeed: "fw-true-false-small-001",
  settings: {
    ...defaultTrueFalseSettings(),
    timerMode: "none",
    speed: 5,
    lives: null,
    repeatUntilTime: false,
    showAnswers: true,
  },
  content: {
    family: "statements",
    version: 1,
    statements: [
      {
        id: id(1),
        content: { text: "Earth is the third planet from the Sun." },
        isTrue: true,
      },
      {
        id: id(2),
        content: { text: "The Moon is a planet." },
        isTrue: false,
      },
      {
        id: id(3),
        content: { text: "Water freezes at 0°C at standard pressure." },
        isTrue: true,
      },
      {
        id: id(4),
        content: { text: "Humans need oxygen to breathe." },
        isTrue: true,
      },
      {
        id: id(5),
        content: { text: "A year has exactly 300 days." },
        isTrue: false,
      },
      {
        id: id(6),
        content: { text: "Fish are mammals." },
        isTrue: false,
      },
    ],
  },
  notes: "Balanced 3 true / 3 false.",
};

const MEDIA = {
  triangle: "bbbbbbbb-bbbb-4bbb-8bbb-000000000010",
} as const;

export const trueFalseFixtureMedium: TrueFalseFixture = {
  id: "fixture-true-false-medium",
  title: "Reading carefully",
  suggestedSeed: "fw-true-false-medium-001",
  settings: {
    ...defaultTrueFalseSettings(),
    timerMode: "countUp",
    speed: 4,
    lives: 3,
    repeatUntilTime: false,
    showAnswers: true,
  },
  content: {
    family: "statements",
    version: 1,
    statements: [
      {
        id: id(101),
        content: {
          text: "Photosynthesis is the process plants use to make food from sunlight, water, and carbon dioxide.",
        },
        isTrue: true,
      },
      {
        id: id(102),
        content: {
          text: "If a map’s legend is missing, every color and symbol on that map will always mean the same thing in every country without any explanation.",
        },
        isTrue: false,
      },
      {
        id: id(103),
        content: {
          text: "A triangle with three equal sides is called an equilateral triangle.",
          imageAssetId: MEDIA.triangle,
          imageAlt: "Equilateral triangle outline",
          imageFit: "contain",
        },
        isTrue: true,
      },
      {
        id: id(104),
        content: {
          text: "The water cycle includes evaporation, condensation, and precipitation as major stages students learn in elementary science.",
        },
        isTrue: true,
      },
      {
        id: id(105),
        content: {
          text: "Because magnets can attract some metals, every metal object in a classroom—including pure copper wire and aluminum foil—will stick strongly to a typical bar magnet.",
        },
        isTrue: false,
      },
      {
        id: id(106),
        content: {
          text: "An author writes a book; an illustrator often creates the pictures that go with the story.",
        },
        isTrue: true,
      },
      {
        id: id(107),
        content: { text: "Midnight is the middle of the afternoon." },
        isTrue: false,
      },
      {
        id: id(108),
        content: {
          text: "When we reduce, reuse, and recycle, we can help lower waste that ends up in landfills, though recycling rules still differ by community.",
        },
        isTrue: true,
      },
    ],
  },
  notes: "Long statements + one image; layout and timing readability.",
};

export const trueFalseFixtureStress: TrueFalseFixture = {
  id: "fixture-true-false-stress",
  title: "Imbalance and repeat-until-time",
  suggestedSeed: "fw-true-false-stress-001",
  settings: {
    ...defaultTrueFalseSettings(),
    timerMode: "countDown",
    timerSeconds: 45,
    speed: 8,
    lives: 2,
    repeatUntilTime: true,
    showAnswers: true,
  },
  content: {
    family: "statements",
    version: 1,
    statements: [
      {
        id: id(201),
        content: { text: "One plus one equals two." },
        isTrue: true,
      },
      {
        id: id(202),
        content: { text: "The sun rises in the east." },
        isTrue: true,
      },
      {
        id: id(203),
        content: { text: "Books can be borrowed from a library." },
        isTrue: true,
      },
      {
        id: id(204),
        content: { text: "Plants need light to grow well." },
        isTrue: true,
      },
      {
        id: id(205),
        content: { text: "Ice is colder than boiling water." },
        isTrue: true,
      },
      {
        id: id(206),
        content: { text: "A square has four sides." },
        isTrue: true,
      },
      {
        id: id(207),
        content: { text: "We use our ears to hear." },
        isTrue: true,
      },
      {
        id: id(208),
        content: { text: "Friday comes after Thursday." },
        isTrue: true,
      },
      {
        id: id(209),
        content: { text: "A bicycle usually has two wheels." },
        isTrue: true,
      },
      {
        id: id(210),
        content: {
          text: "The single false statement in this stress set: penguins are insects.",
        },
        isTrue: false,
      },
      {
        id: id(211),
        content: {
          text: "Long stress line: when scientists carefully measure rainfall with a rain gauge over many days, they can describe weather patterns for a region, compare seasons, and help communities plan for floods or dry spells without claiming that any single afternoon storm predicts the entire year.",
        },
        isTrue: true,
      },
      {
        id: id(212),
        content: {
          text: "Another long true line: classroom routines such as lining up quietly, listening when others speak, and putting materials away help everyone learn, stay safe, and feel respected during busy school days.",
        },
        isTrue: true,
      },
    ],
  },
  notes:
    "Imbalance warning (mostly true). High speed + repeat-until-time + short countdown.",
};

export const trueFalseFixtureMin: TrueFalseFixture = {
  id: "fixture-true-false-min",
  title: "Two statements only",
  suggestedSeed: "fw-true-false-min-001",
  settings: defaultTrueFalseSettings(),
  content: {
    family: "statements",
    version: 1,
    statements: [
      {
        id: id(301),
        content: { text: "Two plus two equals four." },
        isTrue: true,
      },
      {
        id: id(302),
        content: { text: "The sky is always green." },
        isTrue: false,
      },
    ],
  },
  notes: "Edge: minimum playable (2 statements).",
};

export const trueFalseFixtures = {
  small: trueFalseFixtureSmall,
  medium: trueFalseFixtureMedium,
  stress: trueFalseFixtureStress,
  min: trueFalseFixtureMin,
} as const;
