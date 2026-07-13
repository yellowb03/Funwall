import type { ListContentV1 } from "@/domain/content/list.v1";
import {
  defaultWheelSettings,
  type WheelSettings,
} from "@/features/templates/wheel/settings";

/** Deterministic UUIDs for wheel fixtures (RFC-like v4 shape). */
function id(n: number): string {
  const hex = n.toString(16).padStart(12, "0");
  return `aaaaaaaa-bbbb-4ccc-8ddd-${hex}`;
}

export interface WheelFixture {
  id: string;
  title: string;
  suggestedSeed: string;
  settings: WheelSettings;
  content: ListContentV1;
  notes: string;
}

export const wheelFixtureSmall: WheelFixture = {
  id: "fixture-wheel-small",
  title: "Classroom helpers",
  suggestedSeed: "fw-wheel-small-001",
  settings: {
    ...defaultWheelSettings(),
    spinPower: "high",
    allowEliminate: true,
  },
  content: {
    family: "list",
    version: 1,
    instruction: "Spin to pick today's helper.",
    items: [
      { id: id(1), content: { text: "Line leader" } },
      { id: id(2), content: { text: "Board cleaner" } },
      { id: id(3), content: { text: "Paper passer" } },
      { id: id(4), content: { text: "Door holder" } },
      { id: id(5), content: { text: "Timekeeper" } },
      { id: id(6), content: { text: "Supply manager" } },
    ],
  },
  notes: "Six text-only items; baseline wheel happy path.",
};

const MEDIA = {
  water: "bbbbbbbb-bbbb-4bbb-8bbb-000000000001",
  magnets: "bbbbbbbb-bbbb-4bbb-8bbb-000000000002",
  forest: "bbbbbbbb-bbbb-4bbb-8bbb-000000000003",
  ice: "bbbbbbbb-bbbb-4bbb-8bbb-000000000004",
  recycle: "bbbbbbbb-bbbb-4bbb-8bbb-000000000005",
  seasons: "bbbbbbbb-bbbb-4bbb-8bbb-000000000006",
} as const;

export const wheelFixtureMedium: WheelFixture = {
  id: "fixture-wheel-medium",
  title: "Science warm-up topics",
  suggestedSeed: "fw-wheel-medium-001",
  settings: {
    ...defaultWheelSettings(),
    timerMode: "countUp",
    spinPower: "low",
    shuffleItemOrder: true,
    allowEliminate: true,
    imageDisplayPolicy: "auto",
  },
  content: {
    family: "list",
    version: 1,
    instruction: "Spin for a discussion starter.",
    items: [
      {
        id: id(101),
        content: {
          text: "Water cycle",
          imageAssetId: MEDIA.water,
          imageAlt: "Simple diagram of the water cycle",
          imageFit: "contain",
        },
      },
      { id: id(102), content: { text: "Plant parts" } },
      {
        id: id(103),
        content: {
          text: "Magnets",
          imageAssetId: MEDIA.magnets,
          imageAlt: "Two bar magnets",
          imageFit: "cover",
          focalPoint: { x: 0.5, y: 0.5 },
        },
      },
      { id: id(104), content: { text: "Moon phases" } },
      {
        id: id(105),
        content: {
          text: "Habitats",
          imageAssetId: MEDIA.forest,
          imageAlt: "Forest habitat",
          imageFit: "cover",
        },
      },
      { id: id(106), content: { text: "Food chains" } },
      { id: id(107), content: { text: "Weather tools" } },
      {
        id: id(108),
        content: {
          text: "Solids and liquids",
          imageAssetId: MEDIA.ice,
          imageAlt: "Ice cubes and water glass",
          imageFit: "contain",
        },
      },
      { id: id(109), content: { text: "Human body" } },
      {
        id: id(110),
        content: {
          text: "Recycling",
          imageAssetId: MEDIA.recycle,
          imageAlt: "Recycling symbol on bins",
          imageFit: "contain",
        },
      },
      { id: id(111), content: { text: "Shadows" } },
      {
        id: id(112),
        content: {
          text: "Seasons",
          imageAssetId: MEDIA.seasons,
          imageAlt: "Tree in four seasons collage",
          imageFit: "cover",
        },
      },
    ],
  },
  notes: "Twelve mixed text/image items.",
};

export const wheelFixtureMinPlayable: WheelFixture = {
  id: "fixture-wheel-min",
  title: "Two items only",
  suggestedSeed: "fw-wheel-min-001",
  settings: defaultWheelSettings(),
  content: {
    family: "list",
    version: 1,
    items: [
      { id: id(201), content: { text: "Heads" } },
      { id: id(202), content: { text: "Tails" } },
    ],
  },
  notes: "Edge: minimum playable (2 items).",
};

export const wheelFixtureOddCount: WheelFixture = {
  id: "fixture-wheel-odd",
  title: "Three segments",
  suggestedSeed: "fw-wheel-odd-001",
  settings: {
    ...defaultWheelSettings(),
    spinPower: "medium",
    allowEliminate: true,
  },
  content: {
    family: "list",
    version: 1,
    items: [
      { id: id(301), content: { text: "A" } },
      { id: id(302), content: { text: "B" } },
      { id: id(303), content: { text: "C" } },
    ],
  },
  notes: "Edge: odd segment count for angle math.",
};

export const wheelFixtureMany: WheelFixture = {
  id: "fixture-wheel-many",
  title: "Thirty labels",
  suggestedSeed: "fw-wheel-many-001",
  settings: {
    ...defaultWheelSettings(),
    spinPower: "high",
    allowEliminate: false,
    imageDisplayPolicy: "resultOnly",
  },
  content: {
    family: "list",
    version: 1,
    instruction: "Warn path: 30 items.",
    items: Array.from({ length: 30 }, (_, i) => ({
      id: id(400 + i),
      content: { text: `Item ${i + 1}` },
    })),
  },
  notes: "Edge: 30 items (warn boundary for labels).",
};

export const wheelFixtures = {
  small: wheelFixtureSmall,
  medium: wheelFixtureMedium,
  min: wheelFixtureMinPlayable,
  odd: wheelFixtureOddCount,
  many: wheelFixtureMany,
} as const;
