import type { PublicActivitySnapshot } from "@/domain/snapshot";
import { buildListContent, buildQuizContent } from "@/test/fixtures";

/** Deterministic UUIDs for player shell tests. */
export const PLAYER_FIXTURE_IDS = {
  activityWheel: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  activityQuiz: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
  slugWheel: "pub-wheel-fixture-01",
  slugQuiz: "pub-quiz-fixture-01",
  slugMissing: "pub-missing-not-found",
} as const;

export function buildWheelSnapshot(
  overrides?: Partial<PublicActivitySnapshot>,
): PublicActivitySnapshot {
  return {
    activityId: PLAYER_FIXTURE_IDS.activityWheel,
    publicSlug: PLAYER_FIXTURE_IDS.slugWheel,
    revision: 1,
    title: "Classroom supplies wheel",
    instruction: "Spin to pick a supply",
    templateKey: "wheel",
    templateVersion: 1,
    content: buildListContent(),
    settings: {
      version: 1,
      timerMode: "none",
      spinPower: "medium",
      shuffleItemOrder: false,
    },
    themeKey: "default",
    isScored: false,
    hasLeaderboard: false,
    ...overrides,
  };
}

export function buildScoredQuizSnapshot(
  overrides?: Partial<PublicActivitySnapshot>,
): PublicActivitySnapshot {
  return {
    activityId: PLAYER_FIXTURE_IDS.activityQuiz,
    publicSlug: PLAYER_FIXTURE_IDS.slugQuiz,
    revision: 1,
    title: "Continents quiz",
    instruction: "Choose the correct answer",
    templateKey: "gameshow-quiz",
    templateVersion: 1,
    content: buildQuizContent(),
    settings: {
      version: 1,
      timerMode: "countUp",
    },
    themeKey: "default",
    isScored: true,
    hasLeaderboard: true,
    ...overrides,
  };
}
