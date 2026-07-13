export * from "@/features/player/types";
export * from "@/features/player/mock-adapter";
export {
  createLifecycleMachine,
  IllegalLifecycleTransitionError,
  LIFECYCLE_TRANSITIONS,
  isTerminalLifecycle,
  canAcceptGameplayInput,
  type LifecycleMachine,
} from "@/features/player/lifecycle/machine";
export type {
  PlaySession,
  PublicPlayPort,
  StartSessionInput,
  LeaderboardEntry,
  SessionStatus,
} from "@/features/player/session/types";
export {
  MemoryPublicPlayPort,
  createMemoryPublicPlayPort,
  compareLeaderboard,
} from "@/features/player/session/memory-public-play-port";
export {
  SessionEventBuffer,
  createSessionEventBuffer,
} from "@/features/player/session/event-buffer";
export { PlayerShell, type PlayerShellProps } from "@/features/player/shell/PlayerShell";
export { PlayerHud, type PlayerHudProps } from "@/features/player/shell/Hud";
export {
  StartOverlay,
  type StartOverlayProps,
} from "@/features/player/shell/StartOverlay";
export { PlayerErrorBoundary } from "@/features/player/shell/PlayerErrorBoundary";
export {
  createFakePlayerAdapter,
  loadFakePlayerAdapterModule,
  type FakeAdapterAction,
  type FakePlayerAdapterOptions,
} from "@/features/player/harness/fake-adapter";
export {
  buildWheelSnapshot,
  buildScoredQuizSnapshot,
  PLAYER_FIXTURE_IDS,
} from "@/features/player/fixtures";
