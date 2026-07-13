import type {
  PlayerAdapter,
  PlayerAdapterContext,
} from "@/features/player/types";

export type FakeAdapterAction =
  | "correct"
  | "incorrect"
  | "timeout"
  | "pause"
  | "complete"
  | "gameOver"
  | "fatal"
  | "unscoredComplete";

export interface FakePlayerAdapterOptions {
  /** Auto-call onReady after mount. Default true. */
  autoReady?: boolean;
  /** When set, auto-fire this action shortly after play starts (resume path). */
  autoAction?: FakeAdapterAction;
}

/**
 * Fake template player for shell integration tests.
 * Triggers correct/incorrect/timeout/pause/complete/gameOver/fatal/unscoredComplete.
 */
export function createFakePlayerAdapter(
  options?: FakePlayerAdapterOptions,
): PlayerAdapter & {
  getContext: () => PlayerAdapterContext | null;
  trigger: (action: FakeAdapterAction) => void;
} {
  let context: PlayerAdapterContext | null = null;
  let mounted = false;
  const autoReady = options?.autoReady ?? true;

  function trigger(action: FakeAdapterAction): void {
    if (!context || !mounted) return;
    const c = context;
    const elapsed = c.timer.getSnapshot().elapsedMs;

    switch (action) {
      case "correct":
        c.sessionEvents.emit({
          type: "answer.resolved",
          elapsedMs: elapsed,
          metadata: { correct: true },
        });
        c.audio.emit("answer.correct");
        break;
      case "incorrect":
        c.sessionEvents.emit({
          type: "answer.resolved",
          elapsedMs: elapsed,
          metadata: { correct: false },
        });
        c.audio.emit("answer.incorrect");
        break;
      case "timeout":
        c.sessionEvents.emit({
          type: "answer.resolved",
          elapsedMs: elapsed,
          metadata: { reason: "timeout" },
        });
        break;
      case "pause":
        c.lifecycle.onPauseSafeState({ fake: true });
        break;
      case "complete":
        c.sessionEvents.emit({
          type: "game.completed",
          elapsedMs: elapsed,
        });
        c.audio.emit("game.complete");
        c.lifecycle.onComplete({
          score: 100,
          correctCount: 1,
          incorrectCount: 0,
          unansweredCount: 0,
          accuracy: 1,
          templateDetail: { version: 1, data: {} },
        });
        break;
      case "unscoredComplete":
        c.sessionEvents.emit({
          type: "game.completed",
          elapsedMs: elapsed,
        });
        c.audio.emit("game.complete");
        c.lifecycle.onComplete({
          score: null,
          templateDetail: { version: 1, data: { spins: 1 } },
        });
        break;
      case "gameOver":
        c.sessionEvents.emit({
          type: "game.over",
          elapsedMs: elapsed,
        });
        c.audio.emit("game.over");
        c.lifecycle.onGameOver({
          score: 0,
          correctCount: 0,
          incorrectCount: 1,
          unansweredCount: 0,
          accuracy: 0,
          templateDetail: { version: 1, data: {} },
        });
        break;
      case "fatal":
        c.lifecycle.onFatalError("fake-diag", "Fake fatal error");
        break;
      default:
        break;
    }
  }

  return {
    getContext: () => context,
    trigger,
    async mount(ctx) {
      context = ctx;
      mounted = true;
      if (autoReady) {
        ctx.lifecycle.onReady();
        ctx.sessionEvents.emit({
          type: "game.ready",
          elapsedMs: 0,
        });
      }
    },
    unmount() {
      mounted = false;
      context = null;
    },
    pause() {
      /* shell owns pause; adapter may freeze input */
    },
    resume() {
      if (options?.autoAction) {
        trigger(options.autoAction);
      }
    },
    restart() {
      /* shell remounts */
    },
  };
}

export async function loadFakePlayerAdapterModule(
  options?: FakePlayerAdapterOptions,
) {
  return {
    createPlayerAdapter: () => createFakePlayerAdapter(options),
  };
}
